package com.hotel.controllers.manager;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.DeletionResponse;
import com.hotel.common.response.ApiResponse;
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.feedback.dto.FeedbackReplyRequest;
import com.hotel.modules.feedback.dto.FeedbackResponse;
import com.hotel.modules.pricing.request.PricingRequestService;
import com.hotel.modules.pricing.request.dto.PricingRequestCreateRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestResponse;
import com.hotel.modules.room.RoomService;
import com.hotel.modules.room.dto.RoomCreateRequest;
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomUpdateRequest;
import com.hotel.modules.service.ServiceService;
import com.hotel.modules.service.dto.ServiceCreateRequest;
import com.hotel.modules.service.dto.ServiceResponse;
import com.hotel.modules.service.dto.ServiceUpdateRequest;
import com.hotel.security.CurrentUser;
import com.hotel.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiPath.MANAGER)
public class ManagerController {

	private final RoomService roomService;
	private final BookingService bookingService;
    private final PricingRequestService pricingRequestService;
    private final FeedbackService feedbackService;
	private final ServiceService serviceService;
	private final SecurityUtils securityUtils;

	public ManagerController(
        RoomService roomService,
        BookingService bookingService,
        PricingRequestService pricingRequestService,
		FeedbackService feedbackService,
		ServiceService serviceService,
		SecurityUtils securityUtils
    ) {
		this.roomService = roomService;
		this.bookingService = bookingService;
		this.pricingRequestService = pricingRequestService;
		this.feedbackService = feedbackService;
		this.serviceService = serviceService;
		this.securityUtils = securityUtils;
	}

	@PostMapping("/pricing-requests")
	public ApiResponse<PricingRequestResponse> createPricingRequest(@Valid @RequestBody PricingRequestCreateRequest payload) {
		return ApiResponse.ok("Pricing request created", pricingRequestService.create(payload));
	}

	@GetMapping("/pricing-requests")
	public ApiResponse<List<PricingRequestResponse>> getPricingRequests() {
		return ApiResponse.ok("Pricing request list", pricingRequestService.getAll());
	}

	@GetMapping("/pricing-requests/{id}")
	public ApiResponse<PricingRequestResponse> getPricingRequest(@PathVariable String id) {
		return ApiResponse.ok("Pricing request detail", pricingRequestService.getById(id));
	}

	@PostMapping("/rooms")
	public ApiResponse<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest payload) {
		return ApiResponse.ok("Room created", roomService.createRoom(payload));
	}

	@PutMapping("/rooms/{id}")
	public ApiResponse<RoomResponse> updateRoom(@PathVariable String id, @Valid @RequestBody RoomUpdateRequest payload) {
		return ApiResponse.ok("Room updated", roomService.updateRoom(id, payload));
	}

	@DeleteMapping("/rooms/{id}")
	public ApiResponse<DeletionResponse> deleteRoom(@PathVariable String id) {
		return ApiResponse.ok("Room deleted", new DeletionResponse(id, roomService.deleteRoom(id)));
	}

	@GetMapping("/bookings")
	public ApiResponse<List<BookingResponse>> getBookings() {
		BookingFilterRequest filter = new BookingFilterRequest();
		filter.setBranchId(requireBranchIdFromToken());
		return ApiResponse.ok("Manager booking list", bookingService.findByFilter(filter));
	}

	@GetMapping("/feedbacks")
	public ApiResponse<List<FeedbackResponse>> getFeedbacks(@RequestParam String roomId) {
		return ApiResponse.ok("Feedback list", feedbackService.getByRoom(roomId));
	}

	@PostMapping("/feedbacks/reply")
	public ApiResponse<FeedbackResponse> replyFeedback(@Valid @RequestBody FeedbackReplyRequest payload) {
		return ApiResponse.ok("Feedback replied", feedbackService.reply(payload));
	}

	@GetMapping("/services")
	public ApiResponse<List<ServiceResponse>> getServicesByBranch(@org.springframework.web.bind.annotation.RequestParam String branchId) {
		return ApiResponse.ok("Service list", serviceService.getByBranch(branchId));
	}

	@PostMapping("/services")
	public ApiResponse<ServiceResponse> createService(@Valid @RequestBody ServiceCreateRequest payload) {
		return ApiResponse.ok("Service created", serviceService.create(payload));
	}

	@PutMapping("/services/{id}")
	public ApiResponse<ServiceResponse> updateService(@PathVariable String id, @Valid @RequestBody ServiceUpdateRequest payload) {
		return ApiResponse.ok("Service updated", serviceService.update(id, payload));
	}

	private String requireBranchIdFromToken() {
		CurrentUser currentUser = securityUtils.getCurrentUser();
		if (currentUser != null && currentUser.getBranchId() != null && !currentUser.getBranchId().isBlank()) {
			return currentUser.getBranchId();
		}
		throw new BusinessException("branchId claim is required in access token for manager booking scope");
	}
}

