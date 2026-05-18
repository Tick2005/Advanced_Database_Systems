package com.hotel.modules.booking;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.enums.BookingStatus;
import com.hotel.common.enums.RoomStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.dto.BookingActionResponse;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.booking.dto.BookingServiceResponse;
import com.hotel.modules.booking.dto.BookingServiceUpdateRequest;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.service.ServiceRecord;
import com.hotel.modules.service.ServiceRepository;

@Service
public class BookingService {

	private final BookingRepository bookingRepository;
	private final BookingMapper bookingMapper;
	private final BookingValidator bookingValidator;
	private final RoomRepository roomRepository;
	private final BookingServiceRepository bookingServiceRepository;
	private final ServiceRepository serviceRepository;

	@Value("${app.booking.hold-minutes:15}")
	private int bookingHoldMinutes;

	public BookingService(
		BookingRepository bookingRepository,
		BookingMapper bookingMapper,
		BookingValidator bookingValidator,
		RoomRepository roomRepository,
		BookingServiceRepository bookingServiceRepository,
		ServiceRepository serviceRepository
	) {
		this.bookingRepository = bookingRepository;
		this.bookingMapper = bookingMapper;
		this.bookingValidator = bookingValidator;
		this.roomRepository = roomRepository;
		this.bookingServiceRepository = bookingServiceRepository;
		this.serviceRepository = serviceRepository;
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public BookingResponse createBooking(BookingCreateRequest request) {
		bookingValidator.validateCreateRequest(request);

		// Tầng 1 — Pessimistic Locking tại application layer:
		// SELECT ... FOR UPDATE lock room row trước khi đọc/ghi.
		// Nếu transaction khác đang giữ lock → chờ hoặc timeout → @Retryable retry.
		var room = roomRepository.findByIdForUpdate(UUID.fromString(request.getRoomId()))
			.orElseThrow(() -> new NotFoundException("Room not found: " + request.getRoomId()));

		if (room.getStatus() != RoomStatus.AVAILABLE) {
			throw new BusinessException("Room is not available for new booking");
		}

		// Tầng 2 — Pessimistic Locking tại DB layer (trigger fn_prevent_double_booking):
		// BEFORE INSERT trigger dùng SELECT FOR UPDATE SKIP LOCKED để lock các booking
		// active cùng phòng, kiểm tra overlap ngày. Nếu có overlap → RAISE EXCEPTION.
		// Exception được unwrap thành BusinessException (HTTP 400) trong catch bên dưới.

		BookingEntity entity = bookingMapper.fromCreateRequest(request);
		entity.setStatus(BookingStatus.HOLD);

		try {
			bookingRepository.save(entity);

			room.setStatus(RoomStatus.HELD);
			room.setCurrentBookingId(entity.getId());
			room.setUpdatedAt(LocalDateTime.now());
			roomRepository.save(room);

			return bookingMapper.toResponse(entity);
		} catch (RuntimeException ex) {
			// Unwrap exception từ DB trigger (RAISE EXCEPTION với ERRCODE P0001)
			// hoặc PL/pgSQL RAISE EXCEPTION thông thường → BusinessException (HTTP 400).
			Throwable root = ex;
			while (root.getCause() != null) root = root.getCause();
			String msg = root.getMessage() == null ? ex.getMessage() : root.getMessage();
			if (msg != null && (msg.toLowerCase().contains("not available for dates")
					|| msg.toLowerCase().contains("overlapping active booking exists"))) {
				throw new com.hotel.exception.BusinessException(msg);
			}
			throw ex;
		}
	}

	/**
	 * Walk-in booking: khách đến trực tiếp, thanh toán tại quầy.
	 * Khác với online booking (HOLD → payment → CONFIRMED):
	 *   - Booking tạo ra với status CONFIRMED ngay lập tức
	 *   - Room chuyển sang OCCUPIED ngay (không qua HELD)
	 *   - Không cần bước markPaid() vì đã thanh toán tại quầy
	 */
	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public BookingResponse createWalkInBooking(BookingCreateRequest request) {
		bookingValidator.validateCreateRequest(request);

		var room = roomRepository.findByIdForUpdate(UUID.fromString(request.getRoomId()))
			.orElseThrow(() -> new NotFoundException("Room not found: " + request.getRoomId()));

		if (room.getStatus() != RoomStatus.AVAILABLE) {
			throw new BusinessException("Room is not available for new booking");
		}

		BookingEntity entity = bookingMapper.fromCreateRequest(request);
		// Walk-in = thanh toán tại quầy → CONFIRMED ngay, không qua HOLD
		entity.setStatus(BookingStatus.CONFIRMED);

		try {
			bookingRepository.save(entity);

			// Room → OCCUPIED ngay (khách đã có mặt và thanh toán)
			room.setStatus(RoomStatus.OCCUPIED);
			room.setCurrentBookingId(entity.getId());
			room.setUpdatedAt(LocalDateTime.now());
			roomRepository.save(room);

			return bookingMapper.toResponse(entity);
		} catch (RuntimeException ex) {
			Throwable root = ex;
			while (root.getCause() != null) root = root.getCause();
			String msg = root.getMessage() == null ? ex.getMessage() : root.getMessage();
			if (msg != null && (msg.toLowerCase().contains("not available for dates")
					|| msg.toLowerCase().contains("overlapping active booking exists"))) {
				throw new com.hotel.exception.BusinessException(msg);
			}
			throw ex;
		}
	}

	@Transactional(readOnly = true)
	public List<BookingResponse> getMyBookings(String customerId) {
		return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(UUID.fromString(customerId)).stream()
			.map(bookingMapper::toResponse)
			.toList();
	}

	@Transactional(readOnly = true)
	@SuppressWarnings("null")
	public BookingResponse getBooking(String id) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(id))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + id));
		return bookingMapper.toResponse(entity);
	}

	@Transactional(readOnly = true)
	public BookingResponse getBookingForCustomer(String bookingId, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);
		return bookingMapper.toResponse(entity);
	}

	@Transactional
	public BookingResponse cancelBooking(String id, String reason) {
		BookingEntity entity = findByIdOrThrow(id);

		bookingValidator.ensureCancellable(entity);
		entity.setStatus(BookingStatus.CANCELLED);
		entity.setCancelReason(reason);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		releaseRoomFromBooking(entity);
		return bookingMapper.toResponse(entity);
	}

	@Transactional
	public BookingResponse cancelBookingForCustomer(String bookingId, String reason, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);

		bookingValidator.ensureCancellable(entity);
		entity.setStatus(BookingStatus.CANCELLED);
		entity.setCancelReason(reason);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		releaseRoomFromBooking(entity);
		return bookingMapper.toResponse(entity);
	}

	@Transactional(readOnly = true)
	public void ensureCustomerOwnsBooking(String bookingId, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);
	}

	@Transactional(readOnly = true)
	public List<BookingResponse> findByFilter(BookingFilterRequest filter) {
		return bookingRepository.findAll(
				BookingSpecifications.byFilter(filter),
				Sort.by(Sort.Direction.DESC, "createdAt")
			).stream()
			.map(bookingMapper::toResponse)
			.toList();
	}

	/**
	 * Lấy danh sách booking cần xử lý hôm nay cho staff:
	 * - checkInDate <= today AND checkOutDate >= today
	 * - status: CONFIRMED (chờ check-in) hoặc CHECKED_IN (chờ check-out)
	 * - thuộc branch của staff
	 */
	@Transactional(readOnly = true)
	public List<BookingResponse> findTodayActiveBookings(String branchId, java.time.LocalDate today) {
		return bookingRepository.findAll(
				BookingSpecifications.todayActiveByBranch(branchId, today),
				Sort.by(Sort.Direction.ASC, "checkInDate")
			).stream()
			.map(bookingMapper::toResponse)
			.toList();
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public void markPaid(String bookingId) {
		BookingEntity entity = bookingRepository.findByIdForUpdate(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		if (entity.getStatus() == BookingStatus.CONFIRMED) {
			return;
		}
		if (entity.getStatus() != BookingStatus.HOLD && entity.getStatus() != BookingStatus.PENDING_PAYMENT) {
			throw new BusinessException("Only held booking can be marked as paid");
		}

		entity.setStatus(BookingStatus.CONFIRMED);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		occupyRoomForBooking(entity);
	}

	@Transactional
	@SuppressWarnings("null")
	public BookingServiceResponse addService(String bookingId, BookingServiceUpdateRequest request) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		// Lookup service: ưu tiên serviceId (UUID) nếu có, fallback sang serviceCode
		ServiceRecord service;
		if (request.getServiceId() != null && !request.getServiceId().isBlank()) {
			service = serviceRepository.findById(request.getServiceId())
				.orElseThrow(() -> new NotFoundException("Service not found: " + request.getServiceId()));
		} else if (request.getServiceCode() != null && !request.getServiceCode().isBlank()) {
			service = serviceRepository.findByCode(request.getServiceCode())
				.orElseThrow(() -> new NotFoundException("Service code not found: " + request.getServiceCode()));
		} else {
			throw new com.hotel.exception.BusinessException("serviceId or serviceCode is required");
		}

		// Dùng giá thực tế từ request nếu có, fallback sang giá catalog của service
		java.math.BigDecimal actualPrice = request.getActualPrice() != null
			? request.getActualPrice()
			: service.price();

		BookingServiceEntity serviceEntity = new BookingServiceEntity();
		serviceEntity.setId(UUID.randomUUID());
		serviceEntity.setBookingId(entity.getId());
		serviceEntity.setServiceId(service.id());
		// serviceCode is @Transient — set it in-memory for the immediate response.
		// On subsequent loads, resolve via serviceId → ServiceRepository.
		serviceEntity.setServiceCode(service.code());
		serviceEntity.setQuantity(request.getQuantity());
		serviceEntity.setActualPrice(actualPrice);
		bookingServiceRepository.save(serviceEntity);

		BookingServiceResponse response = new BookingServiceResponse();
		response.setBookingId(entity.getId().toString());
		response.setServiceCode(service.code());
		response.setQuantity(serviceEntity.getQuantity());
		return response;
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public BookingActionResponse checkIn(String bookingId, String branchId) {
		BookingEntity entity = bookingRepository.findByIdForUpdate(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		ensureBookingInBranch(entity, branchId);
		if (entity.getStatus() == BookingStatus.CHECKED_IN) {
			return buildActionResponse(entity.getId().toString(), "checkin", entity.getStatus().name());
		}

		if (entity.getStatus() != BookingStatus.CONFIRMED) {
			throw new BusinessException("Only confirmed booking can be checked in");
		}

		entity.setStatus(BookingStatus.CHECKED_IN);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		// Room đã OCCUPIED từ markPaid() — chỉ cần đảm bảo currentBookingId đúng.
		// Không gọi occupyRoomForBooking() lại để tránh redundant write.
		// Trigger fn_enforce_room_status_consistency sẽ validate nếu có sai lệch.
		return buildActionResponse(entity.getId().toString(), "checkin", entity.getStatus().name());
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public BookingActionResponse checkOut(String bookingId, String branchId) {
		BookingEntity entity = bookingRepository.findByIdForUpdate(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		ensureBookingInBranch(entity, branchId);
		if (entity.getStatus() == BookingStatus.CHECKED_OUT) {
			return buildActionResponse(entity.getId().toString(), "checkout", entity.getStatus().name());
		}

		if (entity.getStatus() != BookingStatus.CHECKED_IN) {
			throw new BusinessException("Only checked-in booking can be checked out");
		}

		entity.setStatus(BookingStatus.CHECKED_OUT);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		releaseRoomFromBooking(entity);
		return buildActionResponse(entity.getId().toString(), "checkout", entity.getStatus().name());
	}

	/**
	 * Huỷ booking khi thanh toán VNPay thất bại.
	 * Chỉ huỷ nếu booking đang ở trạng thái HOLD hoặc PENDING_PAYMENT.
	 * Giải phóng phòng về AVAILABLE.
	 */
	@Transactional
	public void cancelBookingOnPaymentFailure(String bookingId) {
		BookingEntity entity = bookingRepository.findByIdForUpdate(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		// Chỉ huỷ nếu chưa ở trạng thái terminal
		if (entity.getStatus() == BookingStatus.CONFIRMED
			|| entity.getStatus() == BookingStatus.CHECKED_IN
			|| entity.getStatus() == BookingStatus.CHECKED_OUT
			|| entity.getStatus() == BookingStatus.CANCELLED
			|| entity.getStatus() == BookingStatus.EXPIRED) {
			// Nếu đã EXPIRED, scheduler đã release room rồi — không cần làm gì thêm
			return;
		}

		entity.setStatus(BookingStatus.CANCELLED);
		entity.setCancelReason("Payment failed via VNPay");
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		releaseRoomFromBooking(entity);
	}

	@Transactional
	public void expireOverdueHoldBookings() {
		// Dùng created_at + 15 phút làm ngưỡng EXPIRED — không cần cột payment_due_at
		LocalDateTime expireThreshold = LocalDateTime.now().minusMinutes(bookingHoldMinutes);
		List<BookingStatus> statuses = List.of(BookingStatus.HOLD, BookingStatus.PENDING_PAYMENT);
		for (BookingEntity booking : bookingRepository.findByStatusInAndCreatedAtBefore(statuses, expireThreshold)) {
			booking.setStatus(BookingStatus.EXPIRED);
			booking.setUpdatedAt(LocalDateTime.now());
			bookingRepository.save(booking);
			releaseRoomFromBooking(booking);
		}
	}

	private void occupyRoomForBooking(BookingEntity booking) {
		var room = roomRepository.findByIdForUpdate(booking.getRoomId())
			.orElseThrow(() -> new NotFoundException("Room not found: " + booking.getRoomId()));
		room.setStatus(RoomStatus.OCCUPIED);
		room.setCurrentBookingId(booking.getId());
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);
	}

	private void releaseRoomFromBooking(BookingEntity booking) {
		var room = roomRepository.findByIdForUpdate(booking.getRoomId())
			.orElseThrow(() -> new NotFoundException("Room not found: " + booking.getRoomId()));
		room.setStatus(RoomStatus.AVAILABLE);
		room.setCurrentBookingId(null);
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);
	}

	private BookingActionResponse buildActionResponse(String bookingId, String action, String status) {
		BookingActionResponse response = new BookingActionResponse();
		response.setBookingId(bookingId);
		response.setAction(action);
		response.setStatus(status);
		return response;
	}

	@SuppressWarnings("null")
	private BookingEntity findByIdOrThrow(String bookingId) {
		return bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
	}

	private void ensureBookingOwnedBy(BookingEntity booking, String customerId) {
		UUID ownerId = UUID.fromString(customerId);
		if (!booking.getCustomerId().equals(ownerId)) {
			throw new BusinessException("Booking does not belong to the current customer");
		}
	}

	private void ensureBookingInBranch(BookingEntity booking, String branchId) {
		UUID scopedBranchId = UUID.fromString(branchId);
		if (!booking.getBranchId().equals(scopedBranchId)) {
			throw new BusinessException("Booking is not in current staff branch scope");
		}
	}
}
