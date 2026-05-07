package com.hotel.controllers.internal;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.integrations.vnpay.VNPayService;
import com.hotel.modules.notification.NotificationService;
import com.hotel.modules.notification.dto.EmailNotificationRequest;
import com.hotel.modules.notification.dto.NotificationResponse;
import com.hotel.modules.payment.dto.VNPayCallbackResponse;
import com.hotel.modules.report.ReportService;
import com.hotel.modules.report.dto.ConversionSummaryResponse;
import com.hotel.modules.report.dto.RevenueReportResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiPath.INTERNAL)
public class InternalController {

	private final ReportService reportService;
	private final VNPayService vnPayService;
	private final NotificationService notificationService;

	public InternalController(
		ReportService reportService,
		VNPayService vnPayService,
		NotificationService notificationService
	) {
		this.reportService = reportService;
		this.vnPayService = vnPayService;
		this.notificationService = notificationService;
	}

	@GetMapping("/payments/vnpay-callback")
	public ApiResponse<VNPayCallbackResponse> vnpayCallback(@RequestParam java.util.Map<String, String> query) {
		return ApiResponse.ok("VNPay callback processed", vnPayService.handleReturnCallback(query));
	}

	@GetMapping("/payments/vnpay-return")
	public ApiResponse<VNPayCallbackResponse> vnpayReturn(@RequestParam java.util.Map<String, String> query) {
		return ApiResponse.ok("VNPay return callback processed", vnPayService.handleReturnCallback(query));
	}

	@GetMapping("/analytics/top-rooms")
	public ApiResponse<List<RevenueReportResponse>> topRooms() {
		return ApiResponse.ok("Top rooms analytics", reportService.getTopRoomTypesByProfit());
	}

	@GetMapping("/analytics/conversion")
	public ApiResponse<ConversionSummaryResponse> conversion() {
		return ApiResponse.ok("Conversion analytics", reportService.getConversionSummary());
	}

	@PostMapping("/notifications/email")
	public ApiResponse<NotificationResponse> sendEmail(@Valid @RequestBody EmailNotificationRequest payload) {
		return ApiResponse.ok("Email notification queued", notificationService.sendEmail(payload));
	}
}

