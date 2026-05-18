package com.hotel.modules.room;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.hotel.modules.room.dto.RoomResponse;

@Component
public class RoomMapper {

	private final JdbcTemplate jdbcTemplate;

	public RoomMapper(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public RoomResponse toResponse(RoomEntity room, RoomTypeEntity roomType, String city, String imageUrl) {
		RoomResponse response = new RoomResponse();
		response.setId(room.getId().toString());
		response.setRoomNumber(room.getRoomNumber());
		response.setRoomTypeId(room.getRoomTypeId().toString());
		response.setRoomTypeName(roomType != null ? roomType.getName() : "Unknown");
		response.setDescription(roomType != null ? roomType.getDescription() : null);
		response.setBranchId(room.getBranchId());
		response.setBranchCity(city);
		response.setImageUrl(imageUrl);
		response.setStatus(room.getStatus().name());
		response.setRate(room.getRate());
		response.setMaxOccupancy(room.getMaxOccupancy());
		response.setAverageRating(room.getAverageRating() != null ? room.getAverageRating() : 0.0);
		response.setNotes(room.getNotes());
		response.setFloor(room.getFloor());

		// Tính effective_rate từ view v_room_effective_rates (áp pricing_season đang active)
		// Nếu không có season → effectiveRate = rate (giá gốc)
		enrichEffectiveRate(room.getId(), room.getRate(), response);

		return response;
	}

	/**
	 * Query view v_room_effective_rates để lấy giá hiệu lực và thông tin season.
	 * View này tính on-the-fly: effective_rate = base_rate × (1 - discount/100).
	 * Nếu không có season active hôm nay → effective_rate = base_rate.
	 */
	private void enrichEffectiveRate(UUID roomId, BigDecimal fallbackRate, RoomResponse response) {
		try {
			jdbcTemplate.query(
				"""
				SELECT effective_rate, active_season_name, active_discount_percent
				FROM v_room_effective_rates
				WHERE room_id = ?
				""",
				rs -> {
					BigDecimal effectiveRate = rs.getBigDecimal("effective_rate");
					String seasonName = rs.getString("active_season_name");
					BigDecimal discountPct = rs.getBigDecimal("active_discount_percent");

					response.setEffectiveRate(effectiveRate != null ? effectiveRate : fallbackRate);
					response.setActiveSeasonName(seasonName);
					response.setActiveDiscountPercent(discountPct);
				},
				roomId
			);
		} catch (Exception e) {
			// Fallback: nếu view lỗi, dùng rate gốc
			response.setEffectiveRate(fallbackRate);
		}

		// Đảm bảo effectiveRate luôn có giá trị
		if (response.getEffectiveRate() == null) {
			response.setEffectiveRate(fallbackRate);
		}
	}
}
