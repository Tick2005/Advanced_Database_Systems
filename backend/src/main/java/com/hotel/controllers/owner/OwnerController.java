package com.hotel.controllers.owner;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.common.response.DeletionResponse;
import com.hotel.modules.branch.BranchService;
import com.hotel.modules.branch.dto.BranchCreateRequest;
import com.hotel.modules.branch.dto.BranchResponse;
import com.hotel.modules.branch.dto.BranchUpdateRequest;
import com.hotel.modules.dashboard.DashboardService;
import com.hotel.modules.dashboard.dto.DashboardSummaryResponse;
import com.hotel.modules.pricing.log.PricingLogEntity;
import com.hotel.modules.pricing.log.PricingLogService;
import com.hotel.modules.pricing.log.dto.OwnerLogResponse;
import com.hotel.modules.pricing.pricing.PricingRepository;
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
import com.hotel.modules.room.RoomService;
import com.hotel.modules.room.RoomTypeEntity;
import com.hotel.modules.room.RoomTypeRepository;
import com.hotel.modules.user.UserService;
import com.hotel.modules.user.dto.RoleUpdateRequest;
import com.hotel.modules.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPath.OWNER)
public class OwnerController {

	private final PricingService pricingService;
	private final PricingRepository pricingRepository;
	private final PricingRequestService pricingRequestService;
	private final BranchService branchService;
	private final UserService userService;
	private final ReportService reportService;
	private final DashboardService dashboardService;
	private final PricingLogService pricingLogService;
	private final com.hotel.modules.user.ProfileRepository profileRepository;
	private final RoomTypeRepository roomTypeRepository;
	private final RoomService roomService;

	public OwnerController(
		PricingService pricingService,
		PricingRepository pricingRepository,
		PricingRequestService pricingRequestService,
		BranchService branchService,
		UserService userService,
		ReportService reportService,
		DashboardService dashboardService,
		PricingLogService pricingLogService,
		com.hotel.modules.user.ProfileRepository profileRepository,
		RoomTypeRepository roomTypeRepository,
		RoomService roomService
	) {
		this.pricingService = pricingService;
		this.pricingRepository = pricingRepository;
		this.pricingRequestService = pricingRequestService;
		this.branchService = branchService;
		this.userService = userService;
		this.reportService = reportService;
		this.dashboardService = dashboardService;
		this.pricingLogService = pricingLogService;
		this.profileRepository = profileRepository;
		this.roomTypeRepository = roomTypeRepository;
		this.roomService = roomService;
	}

	@PostMapping("/pricing")
	public ApiResponse<PricingResponse> createPricing(@Valid @RequestBody PricingCreateRequest payload) {
		return ApiResponse.ok("Pricing created", pricingService.create(payload));
	}

	@PutMapping("/pricing/{id}")
	public ApiResponse<PricingResponse> updatePricing(@PathVariable String id, @Valid @RequestBody PricingUpdateRequest payload) {
		return ApiResponse.ok("Pricing updated", pricingService.update(id, payload));
	}

	@DeleteMapping("/pricing/{id}")
	public ApiResponse<DeletionResponse> deletePricing(@PathVariable String id) {
		pricingRepository.deleteById(java.util.UUID.fromString(id));
		return ApiResponse.ok("Pricing deleted", new DeletionResponse(id, true));
	}

	@GetMapping("/pricing")
	public ApiResponse<List<PricingResponse>> getPricing() {
		// Trả về TẤT CẢ seasons (cả active lẫn inactive) để owner quản lý
		return ApiResponse.ok("All pricing seasons", pricingService.getAllPricing());
	}

	// ── Room Types CRUD ────────────────────────────────────────────────────

	@GetMapping("/room-types")
	public ApiResponse<List<java.util.Map<String, Object>>> getRoomTypes(
			@org.springframework.web.bind.annotation.RequestParam(required = false) String branchId) {
		List<RoomTypeEntity> list = branchId != null && !branchId.isBlank()
			? roomTypeRepository.findByBranchId(java.util.UUID.fromString(branchId))
			: roomTypeRepository.findAll();
		List<java.util.Map<String, Object>> result = list.stream().map(rt -> {
			java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
			m.put("id", rt.getId().toString());
			m.put("branchId", rt.getBranchId() != null ? rt.getBranchId().toString() : null);
			m.put("code", rt.getCode());
			m.put("name", rt.getName());
			m.put("description", rt.getDescription());
			m.put("basePrice", rt.getBasePrice());
			m.put("capacity", rt.getCapacity());
			m.put("bedType", rt.getBedType());
			m.put("active", rt.isActive());
			m.put("averageRating", rt.getAverageRating());
			return m;
		}).toList();
		return ApiResponse.ok("Room types", result);
	}

	@PostMapping("/room-types")
	public ApiResponse<java.util.Map<String, Object>> createRoomType(
			@RequestBody java.util.Map<String, Object> payload) {
		RoomTypeEntity rt = new RoomTypeEntity();
		rt.setId(java.util.UUID.randomUUID());
		rt.setBranchId(java.util.UUID.fromString((String) payload.get("branchId")));
		rt.setCode((String) payload.get("code"));
		rt.setName((String) payload.get("name"));
		// slug: dùng từ payload nếu có, không thì generate từ name
		String slug = (String) payload.getOrDefault("slug", null);
		if (slug == null || slug.isBlank()) {
			slug = ((String) payload.get("name"))
				.toLowerCase()
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("^-|-$", "");
		}
		rt.setSlug(slug);
		rt.setDescription((String) payload.getOrDefault("description", ""));
		rt.setBasePrice(new java.math.BigDecimal(payload.get("basePrice").toString()));
		rt.setCapacity(Integer.parseInt(payload.getOrDefault("capacity", 2).toString()));
		rt.setBedType((String) payload.getOrDefault("bedType", null));
		rt.setActive(true);
		rt.setAverageRating(0.0);
		java.time.LocalDateTime now = java.time.LocalDateTime.now();
		rt.setCreatedAt(now);
		rt.setUpdatedAt(now);
		RoomTypeEntity saved = roomTypeRepository.save(rt);
		return toRoomTypeMap(saved);
	}

	@PutMapping("/room-types/{id}")
	public ApiResponse<java.util.Map<String, Object>> updateRoomType(
			@PathVariable String id,
			@RequestBody java.util.Map<String, Object> payload) {
		return ApiResponse.ok("Room type updated", roomService.updateRoomType(id, payload));
	}

	private ApiResponse<java.util.Map<String, Object>> toRoomTypeMap(RoomTypeEntity saved) {
		java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
		m.put("id", saved.getId().toString());
		m.put("branchId", saved.getBranchId() != null ? saved.getBranchId().toString() : null);
		m.put("code", saved.getCode());
		m.put("name", saved.getName());
		m.put("description", saved.getDescription());
		m.put("basePrice", saved.getBasePrice());
		m.put("capacity", saved.getCapacity());
		m.put("bedType", saved.getBedType());
		m.put("active", saved.isActive());
		m.put("averageRating", saved.getAverageRating());
		return ApiResponse.ok("Room type saved", m);
	}

	@DeleteMapping("/room-types/{id}")
	public ApiResponse<DeletionResponse> deleteRoomType(@PathVariable String id) {
		java.util.UUID uuid = java.util.UUID.fromString(id);
		if (!roomTypeRepository.existsById(uuid)) {
			return ApiResponse.ok("Room type not found", new DeletionResponse(id, false));
		}
		roomTypeRepository.deleteById(uuid);
		return ApiResponse.ok("Room type deleted", new DeletionResponse(id, true));
	}

	@GetMapping("/pricing-requests")
	public ApiResponse<List<PricingRequestResponse>> getPricingRequests() {
		return ApiResponse.ok("Owner pricing requests", pricingRequestService.getAll());
	}

	@PutMapping("/pricing-requests/{id}/approve")
	public ApiResponse<PricingRequestResponse> approvePricingRequest(@PathVariable String id, @Valid @RequestBody(required = false) PricingRequestApproveRequest request) {
		return ApiResponse.ok("Pricing request approved", pricingRequestService.approve(id, request));
	}

	@PutMapping("/pricing-requests/{id}/reject")
	public ApiResponse<PricingRequestResponse> rejectPricingRequest(@PathVariable String id, @Valid @RequestBody(required = false) PricingRequestRejectRequest payload) {
		return ApiResponse.ok("Pricing request rejected", pricingRequestService.reject(id, payload));
	}

	@PostMapping("/branches")
	public ApiResponse<BranchResponse> createBranch(@Valid @RequestBody BranchCreateRequest payload) {
		return ApiResponse.ok("Branch created", branchService.createBranch(payload));
	}

	@PutMapping("/branches/{id}")
	public ApiResponse<BranchResponse> updateBranch(@PathVariable String id, @Valid @RequestBody BranchUpdateRequest payload) {
		return ApiResponse.ok("Branch updated", branchService.updateBranch(id, payload));
	}

	@DeleteMapping("/branches/{id}")
	public ApiResponse<DeletionResponse> deleteBranch(@PathVariable String id) {
		return ApiResponse.ok("Branch deleted", new DeletionResponse(id, branchService.deleteBranch(id)));
	}

	@GetMapping("/users")
	public ApiResponse<List<UserResponse>> getUsers() {
		return ApiResponse.ok("User list", userService.getUsers());
	}

	@PutMapping("/users/{id}/role")
	public ApiResponse<UserResponse> updateRole(@PathVariable String id, @Valid @RequestBody RoleUpdateRequest payload) {
		return ApiResponse.ok("Role updated", userService.updateRole(id, payload.getRole()));
	}

	@PutMapping("/users/{id}/branch")
	public ApiResponse<UserResponse> updateBranch(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
		return ApiResponse.ok("Branch updated", userService.updateBranch(id, payload.get("branchId")));
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
		List<PricingLogEntity> recentLogs = pricingLogService.getRecentLogs();
		
		// Map user IDs to names
		java.util.Set<java.util.UUID> userIds = recentLogs.stream()
			.map(PricingLogEntity::getChangedBy)
			.filter(id -> id != null)
			.collect(java.util.stream.Collectors.toSet());
			
		java.util.Map<java.util.UUID, String> userNames = new java.util.HashMap<>();
		if (!userIds.isEmpty()) {
			profileRepository.findAllById(userIds).forEach(profile -> {
				userNames.put(profile.getUserId(), profile.getFullName());
			});
		}

		List<OwnerLogResponse> logs = recentLogs.stream()
			.map(entity -> toOwnerLogResponse(entity, userNames))
			.toList();
		return ApiResponse.ok("Owner logs", logs);
	}

	private OwnerLogResponse toOwnerLogResponse(PricingLogEntity entity, java.util.Map<java.util.UUID, String> userNames) {
		OwnerLogResponse response = new OwnerLogResponse();
		response.setId(String.valueOf(entity.getId()));
		response.setTime(entity.getChangedAt() != null ? entity.getChangedAt().toString() : null);
		
		String actorName = "system";
		if (entity.getChangedBy() != null) {
			actorName = userNames.getOrDefault(entity.getChangedBy(), entity.getChangedBy().toString());
		}
		response.setActor(actorName);
		
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

