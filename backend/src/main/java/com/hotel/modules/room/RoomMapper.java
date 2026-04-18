package com.hotel.modules.room;

import com.hotel.modules.room.dto.RoomResponse;
import org.springframework.stereotype.Component;

@Component
public class RoomMapper {

	public RoomResponse toResponse(RoomEntity room, RoomTypeEntity roomType, String city) {
		RoomResponse response = new RoomResponse();
		response.setId(room.getId().toString());
		response.setRoomNumber(room.getRoomNumber());
		response.setRoomTypeId(room.getRoomTypeId().toString());
		response.setRoomTypeName(roomType != null ? roomType.getName() : "Unknown");
		response.setBranchId(room.getBranchId());
		response.setBranchCity(city);
		response.setStatus(room.getStatus().name());
		response.setRate(room.getRate());
		response.setMaxOccupancy(room.getMaxOccupancy());
		response.setAverageRating(roomType == null ? 0 : roomType.getAverageRating());
		return response;
	}
}

