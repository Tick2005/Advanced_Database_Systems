package com.hotel.modules.booking;

import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class BookingMapper {

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
		return response;
	}
}

