package com.hotel.modules.booking;

import com.hotel.common.enums.BookingStatus;
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import org.springframework.stereotype.Component;

@Component
public class BookingValidator {

	public void validateCreateRequest(BookingCreateRequest request) {
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

