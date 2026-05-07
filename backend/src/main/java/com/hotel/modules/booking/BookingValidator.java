package com.hotel.modules.booking;

import org.springframework.stereotype.Component;

import com.hotel.common.enums.BookingStatus;
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.dto.BookingCreateRequest;

@Component
public class BookingValidator {

	public void validateCreateRequest(BookingCreateRequest request) {
		if (request.getCheckInDate() == null || request.getCheckOutDate() == null) {
			throw new BusinessException("checkInDate and checkOutDate are required");
		}
		if (request.getTotalPrice() == null) {
			throw new BusinessException("totalPrice is required");
		}
		if (request.getCheckOutDate().isBefore(request.getCheckInDate()) || request.getCheckOutDate().isEqual(request.getCheckInDate())) {
			throw new BusinessException("checkOutDate must be after checkInDate");
		}
		if (request.getTotalPrice().signum() < 0) {
			throw new BusinessException("totalPrice must be >= 0");
		}
	}

	public void ensureCancellable(BookingEntity entity) {
		if (entity.getStatus() == BookingStatus.CANCELLED || entity.getStatus() == BookingStatus.EXPIRED) {
			throw new BusinessException("Booking already closed");
		}
	}
}

