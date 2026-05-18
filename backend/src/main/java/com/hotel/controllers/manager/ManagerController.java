package com.hotel.controllers.manager;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.common.response.DeletionResponse;
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.feedback.dto.FeedbackReplyRequest;
import com.hotel.modules.feedback.dto.FeedbackReportRequest;
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
import com.hotel.modules.user.UserService;
import com.hotel.modules.user.dto.UserResponse;
import com.hotel.security.CurrentUser;
import com.hotel.security.SecurityUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPath.MANAGER)
public class ManagerController {

	private final RoomService roomService;
	private final BookingService bookingService;
    private final PricingRequestService pricingRequestService;
    private final FeedbackService feedbackService;
	private final ServiceService serviceService;
	private final UserService userService;
	private final SecurityUtils securityUtils;
	private final com.hotel.modules.branch.BranchRepository branchRepository;

	public ManagerController(
        RoomService roomService,
        BookingService bookingService,
        PricingRequestService pricingRequestService,
		FeedbackService feedbackService,
		ServiceService serviceService,
		UserService userService,
		SecurityUtils securityUtils,
		com.hotel.modules.branch.BranchRepository branchRepository
    ) {
		this.roomService = roomService;
		this.bookingService = bookingService;
		this.pricingRequestService = pricingRequestService;
		this.feedbackService = feedbackService;
		this.serviceService = serviceService;
		this.userService = userService;
		this.securityUtils = securityUtils;
		this.branchRepository = branchRepository;
	}

	@PostMapping("/pricing-requests")
	public ApiResponse<PricingRequestResponse> createPricingRequest(@Valid @RequestBody PricingRequestCreateRequest payload) {
		return ApiResponse.ok("Pricing request created", pricingRequestService.create(payload));
	}

	/**
	 * GET /api/manager/branch
	 * Returns the branch info for the currently authenticated manager.
	 */
	@GetMapping("/branch")
	public ApiResponse<com.hotel.modules.branch.dto.BranchResponse> getMyBranch() {
		String branchId = requireBranchIdFromToken();
		return branchRepository.findById(java.util.UUID.fromString(branchId))
			.map(b -> {
				com.hotel.modules.branch.dto.BranchResponse r = new com.hotel.modules.branch.dto.BranchResponse();
				r.setId(b.getId().toString());
				r.setName(b.getName());
				r.setCity(b.getCity());
				r.setAddress(b.getAddress());
				r.setPhone(b.getPhone());
				r.setEmail(b.getEmail());
				r.setActive(b.isActive());
				return ApiResponse.ok("Manager branch", r);
			})
			.orElseThrow(() -> new com.hotel.exception.NotFoundException("Branch not found: " + branchId));
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

	@PostMapping("/feedbacks/report")
	public ApiResponse<FeedbackResponse> reportFeedback(@Valid @RequestBody FeedbackReportRequest payload) {
		return ApiResponse.ok("Feedback reported", feedbackService.report(payload));
	}

	@GetMapping("/services")
	public ApiResponse<List<ServiceResponse>> getServicesByBranch() {
		// Chỉ trả về services của branch manager đang đăng nhập
		String branchId = requireBranchIdFromToken();
		return ApiResponse.ok("Service list", serviceService.getByBranch(branchId));
	}

	@GetMapping("/staff")
	public ApiResponse<List<UserResponse>> getStaff() {
		return ApiResponse.ok("Staff list", userService.getUsersByBranch(requireBranchIdFromToken()));
	}

	@PutMapping("/staff/{id}/active")
	public ApiResponse<UserResponse> updateStaffActive(
			@PathVariable String id,
			@RequestBody Map<String, Object> payload) {
		// Đọc giá trị "active" từ payload, mặc định false nếu không có
		Object val = payload != null ? payload.get("active") : null;
		boolean active = Boolean.TRUE.equals(val)
			|| "true".equalsIgnoreCase(String.valueOf(val));
		return ApiResponse.ok("Staff updated", userService.updateActive(id, active));
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

