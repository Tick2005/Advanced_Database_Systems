package com.hotel.controllers.owner;

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
import com.hotel.modules.branch.BranchService;
import com.hotel.modules.branch.dto.BranchCreateRequest;
import com.hotel.modules.branch.dto.BranchResponse;
import com.hotel.modules.dashboard.DashboardService;
import com.hotel.modules.dashboard.dto.DashboardSummaryResponse;
import com.hotel.modules.pricing.log.PricingLogEntity;
import com.hotel.modules.pricing.log.PricingLogService;
import com.hotel.modules.pricing.log.dto.OwnerLogResponse;
import com.hotel.modules.pricing.pricing.PricingService;
import com.hotel.modules.pricing.pricing.dto.PricingCreateRequest;
import com.hotel.modules.pricing.pricing.dto.PricingResponse;
import com.hotel.modules.pricing.pricing.dto.PricingUpdateRequest;
import com.hotel.modules.pricing.request.PricingRequestService;
import com.hotel.modules.pricing.request.dto.PricingRequestApproveRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestRejectRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestResponse;
import com.hotel.modules.report.ReportService;
import com.hotel.modules.report.dto.RevenueReportResponse;
import com.hotel.modules.user.UserService;
import com.hotel.modules.user.dto.RoleUpdateRequest;
import com.hotel.modules.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPath.OWNER)
public class OwnerController {

	private final PricingService pricingService;
	private final PricingRequestService pricingRequestService;
	private final BranchService branchService;
	private final UserService userService;
	private final ReportService reportService;
	private final DashboardService dashboardService;
	private final PricingLogService pricingLogService;

	public OwnerController(
		PricingService pricingService,
		PricingRequestService pricingRequestService,
		BranchService branchService,
		UserService userService,
		ReportService reportService,
		DashboardService dashboardService,
		PricingLogService pricingLogService
	) {
		this.pricingService = pricingService;
		this.pricingRequestService = pricingRequestService;
		this.branchService = branchService;
		this.userService = userService;
		this.reportService = reportService;
		this.dashboardService = dashboardService;
		this.pricingLogService = pricingLogService;
	}

	@PostMapping("/pricing")
	public ApiResponse<PricingResponse> createPricing(@Valid @RequestBody PricingCreateRequest payload) {
		return ApiResponse.ok("Pricing created", pricingService.create(payload));
	}

	@PutMapping("/pricing/{id}")
	public ApiResponse<PricingResponse> updatePricing(@PathVariable String id, @RequestBody PricingUpdateRequest payload) {
		return ApiResponse.ok("Pricing updated", pricingService.update(id, payload));
	}

	@GetMapping("/pricing")
	public ApiResponse<List<PricingResponse>> getPricing() {
		return ApiResponse.ok("Pricing policies", pricingService.getActivePricing());
	}

	@GetMapping("/pricing-requests")
	public ApiResponse<List<PricingRequestResponse>> getPricingRequests() {
		return ApiResponse.ok("Owner pricing requests", pricingRequestService.getAll());
	}

	@PutMapping("/pricing-requests/{id}/approve")
	public ApiResponse<PricingRequestResponse> approvePricingRequest(@PathVariable String id, @RequestBody(required = false) PricingRequestApproveRequest request) {
		return ApiResponse.ok("Pricing request approved", pricingRequestService.approve(id, request));
	}

	@PutMapping("/pricing-requests/{id}/reject")
	public ApiResponse<PricingRequestResponse> rejectPricingRequest(@PathVariable String id, @RequestBody(required = false) PricingRequestRejectRequest payload) {
		return ApiResponse.ok("Pricing request rejected", pricingRequestService.reject(id, payload));
	}

	@PostMapping("/branches")
	public ApiResponse<BranchResponse> createBranch(@Valid @RequestBody BranchCreateRequest payload) {
		return ApiResponse.ok("Branch created", branchService.createBranch(payload));
	}

	@GetMapping("/users")
	public ApiResponse<List<UserResponse>> getUsers() {
		return ApiResponse.ok("User list", userService.getUsers());
	}

	@PutMapping("/users/{id}/role")
	public ApiResponse<UserResponse> updateRole(@PathVariable String id, @RequestBody RoleUpdateRequest payload) {
		return ApiResponse.ok("Role updated", userService.updateRole(id, payload.getRole()));
	}

	@GetMapping("/dashboard")
	public ApiResponse<DashboardSummaryResponse> dashboard() {
		return ApiResponse.ok("Owner dashboard", dashboardService.getOwnerSummary());
	}

	@GetMapping("/reports")
	public ApiResponse<List<RevenueReportResponse>> reports() {
		return ApiResponse.ok("Owner reports", reportService.getTopRoomTypesByProfit());
	}

	@GetMapping("/logs")
	public ApiResponse<List<OwnerLogResponse>> logs() {
		List<OwnerLogResponse> logs = pricingLogService.getRecentLogs().stream().map(this::toOwnerLogResponse).toList();
		return ApiResponse.ok("Owner logs", logs);
	}

	private OwnerLogResponse toOwnerLogResponse(PricingLogEntity entity) {
		OwnerLogResponse response = new OwnerLogResponse();
		response.setId(String.valueOf(entity.getId()));
		response.setTime(entity.getChangedAt() != null ? entity.getChangedAt().toString() : null);
		response.setActor(entity.getChangedBy() != null ? entity.getChangedBy().toString() : "system");
		response.setAction("ROOM_RATE_UPDATED");
		response.setSource("room_rate_change_audit");
		response.setDetails(String.format(
			"room=%s old=%s new=%s change=%s%% note=%s",
			entity.getRoomId(),
			entity.getOldRate(),
			entity.getNewRate(),
			entity.getChangePercent(),
			entity.getNote() == null ? "" : entity.getNote()
		));
		return response;
	}
}

