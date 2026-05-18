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
		// Cho phép checkInDate = hôm nay (walk-in và online booking cùng ngày).
		// Chỉ reject nếu checkInDate < hôm nay (thực sự trong quá khứ).
		if (request.getCheckInDate().isBefore(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) {
			throw new BusinessException("checkInDate must not be in the past");
		}
		if (request.getCheckOutDate().isBefore(request.getCheckInDate()) || request.getCheckOutDate().isEqual(request.getCheckInDate())) {
			throw new BusinessException("checkOutDate must be after checkInDate");
		}
		if (request.getTotalPrice().signum() < 0) {
			throw new BusinessException("totalPrice must be >= 0");
		}
	}

	public void ensureCancellable(BookingEntity entity) {
		BookingStatus status = entity.getStatus();
		if (status == BookingStatus.CANCELLED || status == BookingStatus.EXPIRED) {
			throw new BusinessException("Booking already closed");
		}
		if (status == BookingStatus.CHECKED_IN || status == BookingStatus.CHECKED_OUT) {
			throw new BusinessException("Cannot cancel a booking that is already checked-in or checked-out");
		}
	}
}

