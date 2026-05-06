package com.hotel.modules.room;

import org.springframework.stereotype.Component;

import com.hotel.modules.room.dto.RoomResponse;

@Component
public class RoomMapper {

	public RoomResponse toResponse(RoomEntity room, RoomTypeEntity roomType, String city, String imageUrl) {
		RoomResponse response = new RoomResponse();
		response.setId(room.getId().toString());
		response.setRoomNumber(room.getRoomNumber());
		response.setRoomTypeId(room.getRoomTypeId().toString());
		response.setRoomTypeName(roomType != null ? roomType.getName() : "Unknown");
		response.setBranchId(room.getBranchId());
		response.setBranchCity(city);
		response.setImageUrl(imageUrl);
		response.setStatus(room.getStatus().name());
		response.setRate(room.getRate());
		response.setMaxOccupancy(room.getMaxOccupancy());
		response.setAverageRating(
			room.getAverageRating() != null
				? room.getAverageRating().doubleValue()
				: 0.0
		);
		return response;
	}
}

