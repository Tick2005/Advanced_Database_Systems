package com.hotel.controllers.staff;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingActionResponse;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.booking.dto.BookingServiceResponse;
import com.hotel.modules.booking.dto.BookingServiceUpdateRequest;
import com.hotel.modules.booking.dto.StaffWalkInBookingCreateRequest;
import com.hotel.modules.room.RoomService;
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomSearchFilter;
import com.hotel.modules.room.dto.RoomStatusUpdateRequest;
import com.hotel.security.CurrentUser;
import com.hotel.security.SecurityUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPath.STAFF)
public class StaffController {

	private final BookingService bookingService;
	private final RoomService roomService;
	private final SecurityUtils securityUtils;

	public StaffController(BookingService bookingService, RoomService roomService, SecurityUtils securityUtils) {
		this.bookingService = bookingService;
		this.roomService = roomService;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/bookings/today")
	public ApiResponse<List<BookingResponse>> getTodayBookings() {
		BookingFilterRequest filter = new BookingFilterRequest();
		LocalDate today = LocalDate.now();
		filter.setFromDate(today);
		filter.setToDate(today);
		filter.setBranchId(requireBranchIdFromToken());
		return ApiResponse.ok("Today bookings", bookingService.findByFilter(filter));
	}

	@PutMapping("/bookings/{id}/checkin")
	public ApiResponse<BookingActionResponse> checkin(@PathVariable String id) {
		return ApiResponse.ok("Check-in success", bookingService.checkIn(id, requireBranchIdFromToken()));
	}

	@PutMapping("/bookings/{id}/checkout")
	public ApiResponse<BookingActionResponse> checkout(@PathVariable String id) {
		return ApiResponse.ok("Check-out success", bookingService.checkOut(id, requireBranchIdFromToken()));
	}

	@PostMapping("/bookings/walk-in")
	public ApiResponse<BookingResponse> walkIn(@Valid @RequestBody StaffWalkInBookingCreateRequest payload) {
		return ApiResponse.ok("Walk-in booking created", bookingService.createBooking(toBookingCreateRequest(payload)));
	}

	@GetMapping("/rooms/status")
	public ApiResponse<List<RoomResponse>> roomStatus() {
		RoomSearchFilter filter = new RoomSearchFilter();
		filter.setBranchId(requireBranchIdFromToken());
		return ApiResponse.ok("Room status", roomService.getRooms(filter));
	}

	@PutMapping("/rooms/{id}/update-status")
	public ApiResponse<RoomResponse> updateRoomStatus(@PathVariable String id, @Valid @RequestBody RoomStatusUpdateRequest payload) {
		return ApiResponse.ok("Room status updated", roomService.updateRoomStatus(id, payload.getStatus()));
	}

	@PutMapping("/bookings/{id}/services")
	public ApiResponse<BookingServiceResponse> updateBookingServices(@PathVariable String id, @Valid @RequestBody BookingServiceUpdateRequest payload) {
		return ApiResponse.ok("Booking services updated", bookingService.addService(id, payload));
	}

	private String requireBranchIdFromToken() {
		CurrentUser currentUser = securityUtils.getCurrentUser();
		if (currentUser != null && currentUser.getBranchId() != null && !currentUser.getBranchId().isBlank()) {
			return currentUser.getBranchId();
		}
		throw new BusinessException("branchId claim is required in access token for staff booking scope");
	}

	private BookingCreateRequest toBookingCreateRequest(StaffWalkInBookingCreateRequest payload) {
		BookingCreateRequest request = new BookingCreateRequest();
		request.setCustomerId(payload.getCustomerId());
		request.setRoomId(payload.getRoomId());
		request.setBranchId(requireBranchIdFromToken());
		request.setCheckInDate(payload.getCheckInDate());
		request.setCheckOutDate(payload.getCheckOutDate());
		request.setAdults(payload.getAdults());
		request.setChildren(payload.getChildren());
		request.setTotalPrice(payload.getTotalPrice());
		return request;
	}
}

