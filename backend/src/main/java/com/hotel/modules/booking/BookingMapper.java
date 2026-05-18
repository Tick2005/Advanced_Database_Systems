package com.hotel.modules.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.booking.dto.BookingServiceItemResponse;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.pricing.pricing.PricingEntity;
import com.hotel.modules.pricing.pricing.PricingRepository;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.room.RoomTypeRepository;
import com.hotel.modules.user.ProfileRepository;
import com.hotel.modules.user.UserRepository;

@Component
public class BookingMapper {
	@Autowired private RoomRepository roomRepository;
	@Autowired private RoomTypeRepository roomTypeRepository;
	@Autowired private BranchRepository branchRepository;
	@Autowired private ProfileRepository profileRepository;
	@Autowired private UserRepository userRepository;
	@Autowired private PricingRepository pricingRepository;
	@Autowired private BookingServiceRepository bookingServiceRepository;
	@Autowired private JdbcTemplate jdbcTemplate;

	@Value("${app.booking.hold-minutes:15}")
	private int bookingHoldMinutes;
	public BookingEntity fromCreateRequest(BookingCreateRequest request) {
		BookingEntity entity = new BookingEntity();
		entity.setId(UUID.randomUUID());
		entity.setCustomerId(UUID.fromString(request.getCustomerId()));
		entity.setRoomId(UUID.fromString(request.getRoomId()));
		entity.setBranchId(UUID.fromString(request.getBranchId()));
		entity.setCheckInDate(request.getCheckInDate());
		entity.setCheckOutDate(request.getCheckOutDate());
		entity.setAdults(request.getAdults());
		entity.setChildren(request.getChildren());
		UUID roomId = entity.getRoomId();

		// Always compute nights for fallback price calculation
		final long nights = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(
			request.getCheckInDate(), request.getCheckOutDate()));

		// Load room to get rate — needed for DB trigger and price fallback
		if (roomId != null) {
			roomRepository.findById(roomId).ifPresent(room -> {
				entity.setRate(room.getRate());
				// Tính totalPrice từ effectiveRate (đã áp pricing_season) nếu có,
				// fallback về room.rate nếu không có season active
				java.math.BigDecimal pricePerNight = getEffectiveRateForRoom(roomId, room.getRate());
				if (pricePerNight != null && pricePerNight.signum() > 0) {
					entity.setTotalPrice(pricePerNight.multiply(java.math.BigDecimal.valueOf(nights)));
				}
			});
		}

		// Override with client-supplied totalPrice ONLY if it is a positive value
		// (client value takes precedence over the server-side calculation)
		// Reject client values <= 0 to force server-side calculation
		if (request.getTotalPrice() != null && request.getTotalPrice().signum() > 0) {
			entity.setTotalPrice(request.getTotalPrice());
		}

		// Last-resort guard: if totalPrice is still null or zero (room not found, rate null/zero),
		// throw a clear business error rather than saving a zero-price booking.
		if (entity.getTotalPrice() == null || entity.getTotalPrice().signum() == 0) {
			throw new com.hotel.exception.BusinessException(
				"Cannot determine room price. Please contact support or try again.");
		}

		LocalDateTime now = LocalDateTime.now();
		entity.setCreatedAt(now);
		entity.setUpdatedAt(now);
		return entity;
	}

	public BookingResponse toResponse(BookingEntity entity) {
		BookingResponse response = new BookingResponse();
		response.setId(entity.getId().toString());
		response.setCustomerId(entity.getCustomerId().toString());
		response.setRoomId(entity.getRoomId().toString());
		response.setBranchId(entity.getBranchId().toString());
		response.setStatus(entity.getStatus().name());
		response.setCheckInDate(entity.getCheckInDate());
		response.setCheckOutDate(entity.getCheckOutDate());
		response.setTotalPrice(entity.getTotalPrice());
		response.setHoldExpiresAt(entity.getCreatedAt() != null
			? entity.getCreatedAt()
				.plusMinutes(bookingHoldMinutes)
				.atZone(ZoneId.systemDefault())
				.toOffsetDateTime()
			: null);
		response.setAdults(entity.getAdults());
		response.setChildren(entity.getChildren());

		UUID roomId = entity.getRoomId();
		if (roomId != null) {
			roomRepository.findById(roomId).ifPresent(room -> {
				response.setRoomNumber(room.getRoomNumber());
				UUID roomTypeId = room.getRoomTypeId();
				if (roomTypeId != null) {
					roomTypeRepository.findById(roomTypeId).ifPresent(rt -> response.setRoomTypeName(rt.getName()));
				}
			});
		}
		UUID branchId = entity.getBranchId();
		if (branchId != null) {
			branchRepository.findById(branchId).ifPresent(branch -> response.setBranchName(branch.getName()));
		}
		UUID customerId = entity.getCustomerId();
		if (customerId != null) {
			profileRepository.findByUserId(customerId).ifPresent(profile -> {
				response.setCustomerName(profile.getFullName());
				response.setCustomerPhone(profile.getPhone());
			});
			userRepository.findById(customerId).ifPresent(user -> response.setCustomerEmail(user.getEmail()));
		}

		// ── Load services đã dùng + tính tổng tiền ──────────────────────────
		List<BookingServiceEntity> serviceEntities = bookingServiceRepository.findByBookingId(entity.getId());
		if (!serviceEntities.isEmpty()) {
			List<BookingServiceItemResponse> serviceItems = new ArrayList<>();
			BigDecimal servicesTotal = BigDecimal.ZERO;

			for (BookingServiceEntity se : serviceEntities) {
				BookingServiceItemResponse item = new BookingServiceItemResponse();
				item.setServiceId(se.getServiceId() != null ? se.getServiceId().toString() : null);
				item.setServiceCode(se.getServiceCode());
				item.setQuantity(se.getQuantity());
				item.setActualPrice(se.getActualPrice() != null ? se.getActualPrice() : BigDecimal.ZERO);

				// Tính unitPrice = actualPrice / quantity (để hiển thị đơn giá)
				if (se.getActualPrice() != null && se.getQuantity() > 0) {
					item.setUnitPrice(se.getActualPrice().divide(
						BigDecimal.valueOf(se.getQuantity()), 2, RoundingMode.HALF_UP));
				}

				// Lookup tên service từ DB nếu có serviceId
				if (se.getServiceId() != null) {
					try {
						List<String> names = jdbcTemplate.query(
							"SELECT name FROM services WHERE id = ?",
							(rs, rowNum) -> rs.getString("name"),
							se.getServiceId()
						);
						if (!names.isEmpty()) item.setServiceName(names.get(0));
					} catch (Exception ignored) {}
				}

				serviceItems.add(item);
				servicesTotal = servicesTotal.add(item.getActualPrice());
			}

			response.setServices(serviceItems);
			response.setServicesTotalPrice(servicesTotal);
			// grandTotal = tiền phòng + tổng services
			BigDecimal roomTotal = entity.getTotalPrice() != null ? entity.getTotalPrice() : BigDecimal.ZERO;
			response.setGrandTotalPrice(roomTotal.add(servicesTotal));
		} else {
			response.setServices(new ArrayList<>());
			response.setServicesTotalPrice(BigDecimal.ZERO);
			response.setGrandTotalPrice(entity.getTotalPrice() != null ? entity.getTotalPrice() : BigDecimal.ZERO);
		}

		// ── Kiểm tra xung đột giá (chỉ cho booking đang HOLD/PENDING_PAYMENT) ──
		if (entity.getStatus() == com.hotel.common.enums.BookingStatus.HOLD
				|| entity.getStatus() == com.hotel.common.enums.BookingStatus.PENDING_PAYMENT) {
			enrichPriceAlert(entity, response);
		}

		return response;
	}

	/**
	 * Tính giá hiệu lực hiện tại và so sánh với giá lúc đặt.
	 *
	 * V10: base = room_types.base_price (không phải booking.rate / rooms.rate).
	 * Owner thay đổi base_price → giá hiệu lực tự cập nhật.
	 * Quy tắc ưu tiên season nhất quán với fn_get_effective_rate trong V6/V10.
	 */
	private void enrichPriceAlert(BookingEntity entity, BookingResponse response) {
		if (entity.getRoomId() == null || entity.getCheckInDate() == null || entity.getCheckOutDate() == null) {
			return;
		}

		var roomOpt = roomRepository.findById(entity.getRoomId());
		if (roomOpt.isEmpty()) return;
		var room = roomOpt.get();
		if (room.getRoomTypeId() == null) return;

		var roomTypeOpt = roomTypeRepository.findById(room.getRoomTypeId());
		if (roomTypeOpt.isEmpty()) return;
		var roomType = roomTypeOpt.get();
		if (roomType.getBranchId() == null) return;

		// V10: dùng room_types.base_price làm gốc, không phải booking.rate
		BigDecimal baseRate = roomType.getBasePrice();
		if (baseRate == null || baseRate.signum() == 0) {
			// Fallback về rooms.rate nếu base_price chưa được set
			baseRate = entity.getRate() != null ? entity.getRate() : room.getRate();
		}
		if (baseRate == null || baseRate.signum() == 0) return;
		response.setOriginalRate(baseRate);

		List<PricingEntity> allSeasons = pricingRepository.findActiveSeasonForBranchAndDates(
			roomType.getBranchId(),
			roomType.getId(),
			entity.getCheckInDate(),
			entity.getCheckOutDate()
		);

		if (allSeasons.isEmpty()) {
			response.setEffectiveRate(baseRate);
			return;
		}

		// Per-day pricing: mỗi ngày áp season ưu tiên nhất, tính trên base_price
		long nights = java.time.temporal.ChronoUnit.DAYS.between(
			entity.getCheckInDate(), entity.getCheckOutDate());
		nights = Math.max(1, nights);

		BigDecimal totalEffective = BigDecimal.ZERO;
		for (long i = 0; i < nights; i++) {
			java.time.LocalDate day = entity.getCheckInDate().plusDays(i);
			PricingEntity dayBest = allSeasons.stream()
				.filter(s -> !day.isBefore(s.getStartsOn()) && !day.isAfter(s.getEndsOn()))
				.findFirst()
				.orElse(null);
			if (dayBest != null && dayBest.getDiscountPercent() != null) {
				BigDecimal dayRate = baseRate.multiply(
					BigDecimal.ONE.subtract(
						dayBest.getDiscountPercent().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
					)
				).setScale(2, RoundingMode.HALF_UP);
				totalEffective = totalEffective.add(dayRate);
			} else {
				totalEffective = totalEffective.add(baseRate);
			}
		}

		BigDecimal effectiveRate = totalEffective.divide(BigDecimal.valueOf(nights), 2, RoundingMode.HALF_UP);
		response.setEffectiveRate(effectiveRate);

		BigDecimal newTotal = totalEffective.setScale(2, RoundingMode.HALF_UP);
		BigDecimal diff = newTotal.subtract(
			entity.getTotalPrice() != null ? entity.getTotalPrice() : BigDecimal.ZERO);

		if (diff.abs().compareTo(BigDecimal.ONE) <= 0) {
			return;
		}

		boolean isIncrease = diff.signum() > 0;
		response.setPriceAlertType(isIncrease ? "INCREASE" : "DECREASE");

		List<PricingEntity> specificSeasons = allSeasons.stream()
			.filter(s -> s.getBranchIds() != null && !s.getBranchIds().isEmpty())
			.toList();
		List<PricingEntity> globalSeasons = allSeasons.stream()
			.filter(s -> s.getBranchIds() == null || s.getBranchIds().isEmpty())
			.toList();
		boolean hasBoth = !specificSeasons.isEmpty() && !globalSeasons.isEmpty();

		PricingEntity dominantSeason = allSeasons.get(0);
		boolean isSpecific = dominantSeason.getBranchIds() != null && !dominantSeason.getBranchIds().isEmpty();
		String sourceLabel = isSpecific ? "yêu cầu từ quản lý chi nhánh" : "chương trình toàn hệ thống";

		String message;
		if (hasBoth) {
			message = String.format(
				"⚠️ Có %d chương trình giá áp dụng trong kỳ lưu trú:\n" +
				"• [Ưu tiên - %s] \"%s\" (%s%%)\n" +
				"• [Phụ] \"%s\" (%s%%)\n" +
				"Giá trung bình: %,.0f₫/đêm. Tổng mới: %,.0f₫.",
				allSeasons.size(),
				sourceLabel, dominantSeason.getName(),
				dominantSeason.getDiscountPercent().toPlainString(),
				allSeasons.size() > 1 ? allSeasons.get(1).getName() : "—",
				allSeasons.size() > 1 && allSeasons.get(1).getDiscountPercent() != null
					? allSeasons.get(1).getDiscountPercent().toPlainString() : "0",
				effectiveRate, newTotal
			);
		} else {
			message = String.format(
				"Giá phòng thay đổi do \"%s\" (%s%%) — %s. " +
				"Giá trung bình: %,.0f₫/đêm. Tổng mới: %,.0f₫.",
				dominantSeason.getName(),
				dominantSeason.getDiscountPercent().toPlainString(),
				sourceLabel,
				effectiveRate, newTotal
			);
		}
		response.setPriceAlertMessage(message);
	}

	/**
	 * Lấy giá hiệu lực của phòng hôm nay từ view v_room_effective_rates.
	 *
	 * Quy tắc (V10): effective_rate = room_types.base_price × (1 - discount/100).
	 * Dùng base_price của room_type làm gốc — không phải rooms.rate —
	 * để owner thay đổi base_price là tự động cập nhật giá hiệu lực.
	 *
	 * Nếu không có season active → trả về base_rate (room_types.base_price).
	 * Fallback về fallbackRate nếu view chưa tồn tại hoặc lỗi.
	 */
	private BigDecimal getEffectiveRateForRoom(UUID roomId, BigDecimal fallbackRate) {
		try {
			// V10: view trả về cả base_rate (room_types.base_price) và effective_rate
			java.util.List<BigDecimal> result = jdbcTemplate.query(
				"SELECT effective_rate FROM v_room_effective_rates WHERE room_id = ?",
				(rs, rowNum) -> rs.getBigDecimal("effective_rate"),
				roomId
			);
			if (!result.isEmpty() && result.get(0) != null) {
				return result.get(0);
			}
			// Nếu phòng không có trong view (room_type inactive, branch inactive),
			// fallback về base_price của room_type
			java.util.List<BigDecimal> basePriceResult = jdbcTemplate.query(
				"SELECT rt.base_price FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id WHERE r.id = ?",
				(rs, rowNum) -> rs.getBigDecimal("base_price"),
				roomId
			);
			if (!basePriceResult.isEmpty() && basePriceResult.get(0) != null) {
				return basePriceResult.get(0);
			}
		} catch (Exception e) {
			// View không tồn tại hoặc lỗi khác → fallback về rate gốc
		}
		return fallbackRate;
	}

}
