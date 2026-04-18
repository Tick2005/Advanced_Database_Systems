package com.hotel.controllers.customer;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.integrations.vnpay.VNPayService;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingCancelRequest;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.CustomerBookingCreateRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.feedback.dto.FeedbackCreateRequest;
import com.hotel.modules.feedback.dto.FeedbackResponse;
import com.hotel.modules.payment.PaymentService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.payment.dto.PaymentResponse;
import com.hotel.modules.payment.dto.VNPayCheckoutRequest;
import com.hotel.modules.payment.dto.VNPayCheckoutResponse;
import com.hotel.modules.user.UserService;
import com.hotel.modules.user.dto.ProfileResponse;
import com.hotel.modules.user.dto.UpdateProfileRequest;
import com.hotel.security.CurrentUser;
import com.hotel.security.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping(ApiPath.CUSTOMER)
public class CustomerController {

	private final BookingService bookingService;
	private final PaymentService paymentService;
	private final VNPayService vnPayService;
    private final FeedbackService feedbackService;
    private final UserService userService;
	private final SecurityUtils securityUtils;

	public CustomerController(
        BookingService bookingService,
        PaymentService paymentService,
        VNPayService vnPayService,
        FeedbackService feedbackService,
        UserService userService,
		SecurityUtils securityUtils
    ) {
		this.bookingService = bookingService;
		this.paymentService = paymentService;
		this.vnPayService = vnPayService;
		this.feedbackService = feedbackService;
		this.userService = userService;
		this.securityUtils = securityUtils;
	}

	@PostMapping("/bookings")
	public ApiResponse<BookingResponse> createBooking(@Valid @RequestBody CustomerBookingCreateRequest payload) {
		return ApiResponse.ok("Booking created", bookingService.createBooking(toBookingCreateRequest(payload, requireCurrentUserId())));
	}

	@GetMapping("/bookings")
	public ApiResponse<List<BookingResponse>> getMyBookings() {
		return ApiResponse.ok("My bookings", bookingService.getMyBookings(requireCurrentUserId()));
	}

	@GetMapping("/bookings/{id}")
	public ApiResponse<BookingResponse> getBookingDetail(@PathVariable String id) {
		return ApiResponse.ok("Booking detail", bookingService.getBookingForCustomer(id, requireCurrentUserId()));
	}

	@PutMapping("/bookings/{id}/cancel")
	public ApiResponse<BookingResponse> cancelBooking(@PathVariable String id, @RequestBody(required = false) BookingCancelRequest request) {
		String reason = request == null ? null : request.getReason();
		return ApiResponse.ok("Booking cancelled", bookingService.cancelBookingForCustomer(id, reason, requireCurrentUserId()));
	}

	@PostMapping("/payments")
	public ApiResponse<PaymentResponse> createPayment(@Valid @RequestBody PaymentCreateRequest payload) {
		return ApiResponse.ok("Payment initiated", paymentService.createPaymentForCustomer(payload, requireCurrentUserId()));
	}

	@PostMapping("/payments/vnpay/checkout-url")
	public ApiResponse<VNPayCheckoutResponse> createVnPayCheckoutUrl(
		@Valid @RequestBody VNPayCheckoutRequest payload,
		HttpServletRequest request
	) {
		return ApiResponse.ok("VNPay checkout URL created", vnPayService.createCheckoutUrl(payload, resolveClientIp(request), requireCurrentUserId()));
	}

	private String resolveClientIp(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (forwarded != null && !forwarded.isBlank()) {
			return forwarded.split(",")[0].trim();
		}
		String realIp = request.getHeader("X-Real-IP");
		if (realIp != null && !realIp.isBlank()) {
			return realIp.trim();
		}
		return request.getRemoteAddr();
	}

	@PostMapping("/feedbacks")
	public ApiResponse<FeedbackResponse> createFeedback(@Valid @RequestBody FeedbackCreateRequest payload) {
		return ApiResponse.ok("Feedback submitted", feedbackService.create(payload));
	}

	@GetMapping("/feedbacks/my")
	public ApiResponse<List<FeedbackResponse>> getMyFeedbacks() {
		return ApiResponse.ok("My feedbacks", feedbackService.getByUser(requireCurrentUserId()));
	}

	@GetMapping("/profile")
	public ApiResponse<ProfileResponse> getProfile() {
		return ApiResponse.ok("Profile data", userService.getProfile(requireCurrentUserId()));
	}

	@PutMapping("/profile")
	public ApiResponse<ProfileResponse> updateProfile(
		@RequestBody UpdateProfileRequest payload
	) {
		return ApiResponse.ok("Profile updated", userService.updateProfile(requireCurrentUserId(), payload));
	}

	private String requireCurrentUserId() {
		CurrentUser currentUser = securityUtils.getCurrentUser();
		if (currentUser == null || currentUser.getUserId() == null || currentUser.getUserId().isBlank()) {
			throw new IllegalStateException("Authenticated user id is missing");
		}
		return currentUser.getUserId();
	}

	private BookingCreateRequest toBookingCreateRequest(CustomerBookingCreateRequest payload, String customerId) {
		BookingCreateRequest request = new BookingCreateRequest();
		request.setCustomerId(customerId);
		request.setRoomId(payload.getRoomId());
		request.setBranchId(payload.getBranchId());
		request.setCheckInDate(payload.getCheckInDate());
		request.setCheckOutDate(payload.getCheckOutDate());
		request.setAdults(payload.getAdults());
		request.setChildren(payload.getChildren());
		request.setTotalPrice(payload.getTotalPrice());
		return request;
	}
}

