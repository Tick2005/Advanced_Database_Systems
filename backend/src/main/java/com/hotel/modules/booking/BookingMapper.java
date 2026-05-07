package com.hotel.modules.booking;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.room.RoomTypeRepository;

@Component
public class BookingMapper {
	@Autowired private RoomRepository roomRepository;
	@Autowired private RoomTypeRepository roomTypeRepository;
	@Autowired private BranchRepository branchRepository;
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
		entity.setTotalPrice(request.getTotalPrice());
		LocalDateTime now = LocalDateTime.now();
		entity.setHoldExpiresAt(now.plusMinutes(15));
		entity.setPaymentDueAt(now.plusMinutes(15));
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
		response.setHoldExpiresAt(entity.getHoldExpiresAt());
		UUID roomId = entity.getRoomId();
		if (roomId != null) {
			roomRepository.findById(roomId).ifPresent(room -> {
				response.setRoomNumber(room.getRoomNumber());
				UUID roomTypeId = room.getRoomTypeId();
				if (roomTypeId != null) {
					roomTypeRepository.findById(roomTypeId).ifPresent(roomType -> response.setRoomTypeName(roomType.getName()));
				}
			});
		}
		UUID branchId = entity.getBranchId();
		if (branchId != null) {
			branchRepository.findById(branchId).ifPresent(branch -> {
				response.setBranchName(branch.getName());
			});
		}
		return response;
	}
}

