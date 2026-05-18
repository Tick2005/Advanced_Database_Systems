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
import com.hotel.modules.service.ServiceService;
import com.hotel.modules.service.dto.ServiceResponse;
import com.hotel.security.CurrentUser;
import com.hotel.security.SecurityUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPath.STAFF)
public class StaffController {

	private final BookingService bookingService;
	private final RoomService roomService;
	private final ServiceService serviceService;
	private final SecurityUtils securityUtils;

	public StaffController(BookingService bookingService, RoomService roomService,
			ServiceService serviceService, SecurityUtils securityUtils) {
		this.bookingService = bookingService;
		this.roomService = roomService;
		this.serviceService = serviceService;
		this.securityUtils = securityUtils;
	}

	@GetMapping("/bookings/today")
	public ApiResponse<List<BookingResponse>> getTodayBookings() {
		String branchId = requireBranchIdFromToken();
		LocalDate today = LocalDate.now();
		// Lấy tất cả booking đang active hôm nay (checkIn <= today <= checkOut)
		// với status cần xử lý: CONFIRMED (chờ check-in) và CHECKED_IN (chờ check-out)
		return ApiResponse.ok("Today bookings", bookingService.findTodayActiveBookings(branchId, today));
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
		// Walk-in: thanh toán tại quầy → CONFIRMED + room OCCUPIED ngay lập tức
		return ApiResponse.ok("Walk-in booking created", bookingService.createWalkInBooking(toBookingCreateRequest(payload)));
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

	/**
	 * GET /api/staff/services
	 * Returns services for the staff's branch so StaffBookingsTodayPage can
	 * populate the service dropdown without a separate branch lookup.
	 */
	@GetMapping("/services")
	public ApiResponse<List<ServiceResponse>> getServices() {
		return ApiResponse.ok("Staff branch services",
			serviceService.getByBranch(requireBranchIdFromToken()));
	}

	/**
	 * POST /api/staff/bookings/{id}/add-service
	 * Convenience endpoint used by StaffBookingsTodayPage to add a service
	 * to an active booking by serviceId + quantity.
	 */
	@PostMapping("/bookings/{id}/add-service")
	public ApiResponse<BookingServiceResponse> addServiceToBooking(
			@PathVariable String id,
			@Valid @RequestBody BookingServiceUpdateRequest payload) {
		return ApiResponse.ok("Service added to booking", bookingService.addService(id, payload));
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

