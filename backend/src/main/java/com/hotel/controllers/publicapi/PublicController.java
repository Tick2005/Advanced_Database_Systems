package com.hotel.controllers.publicapi;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.integrations.vnpay.VNPayService;
import com.hotel.modules.branch.BranchService;
import com.hotel.modules.branch.dto.BranchResponse;
import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.feedback.dto.FeedbackResponse;
import com.hotel.modules.feedback.dto.RoomFeedbackSummaryResponse;
import com.hotel.modules.payment.dto.VNPayCallbackResponse;
import com.hotel.modules.report.ReportService;
import com.hotel.modules.report.dto.RevenueReportResponse;
import com.hotel.modules.room.RoomService;
import com.hotel.modules.room.RoomTypeRepository;
import com.hotel.modules.room.RoomTypeEntity;
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomSearchFilter;
import com.hotel.modules.room.dto.TopRoomResponse;
import com.hotel.modules.service.ServiceService;
import com.hotel.modules.service.dto.ServiceResponse;

@RestController
@RequestMapping(ApiPath.PUBLIC)
public class PublicController {

    private final RoomService roomService;
    private final BranchService branchService;
    private final FeedbackService feedbackService;
    private final ReportService reportService;
    private final ServiceService serviceService;
    private final VNPayService vnPayService;
    private final RoomTypeRepository roomTypeRepository;

    public PublicController(
        RoomService roomService,
        BranchService branchService,
        FeedbackService feedbackService,
        ReportService reportService,
        ServiceService serviceService,
        VNPayService vnPayService,
        RoomTypeRepository roomTypeRepository
    ) {
        this.roomService = roomService;
        this.branchService = branchService;
        this.feedbackService = feedbackService;
        this.reportService = reportService;
        this.serviceService = serviceService;
        this.vnPayService = vnPayService;
        this.roomTypeRepository = roomTypeRepository;
    }

    @GetMapping("/rooms")
    public ApiResponse<List<RoomResponse>> getRooms(RoomSearchFilter filter) {
        return ApiResponse.ok("Public room list", roomService.getRooms(filter));
    }

    @GetMapping("/rooms/{id}")
    public ApiResponse<RoomResponse> getRoomDetail(@PathVariable String id) {
        return ApiResponse.ok("Public room detail", roomService.getRoomDetail(id));
    }

    @GetMapping("/branches")
    public ApiResponse<List<BranchResponse>> getBranches() {
        return ApiResponse.ok("Branch list", branchService.getActiveBranches());
    }

    @GetMapping("/services")
    public ApiResponse<List<ServiceResponse>> getServicesByBranch(@RequestParam String branchId) {
        return ApiResponse.ok("Service list", serviceService.getByBranch(branchId));
    }

    @GetMapping("/feedbacks/{roomId}")
    public ApiResponse<List<FeedbackResponse>> getFeedbackByRoom(@PathVariable String roomId) {
        return ApiResponse.ok("Feedback list", feedbackService.getByRoom(roomId));
    }

    @GetMapping("/feedbacks/top")
    public ApiResponse<List<FeedbackResponse>> getTopFeedbacks(@RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok("Top feedbacks", feedbackService.getTopFeedbacks(limit));
    }

    @GetMapping("/feedbacks/summary")
    public ApiResponse<List<RoomFeedbackSummaryResponse>> getRoomFeedbackSummaries(
            @RequestParam(required = false) List<String> roomIds) {
        return ApiResponse.ok("Room feedback summaries", feedbackService.getRoomSummaries(roomIds));
    }

    @PostMapping("/feedbacks/summary")
    public ApiResponse<List<RoomFeedbackSummaryResponse>> getRoomFeedbackSummariesPost(
            @RequestBody(required = false) Map<String, List<String>> payload) {
        List<String> roomIds = payload == null ? List.of() : payload.getOrDefault("roomIds", List.of());
        return ApiResponse.ok("Room feedback summaries", feedbackService.getRoomSummaries(roomIds));
    }

    @GetMapping("/top-room-types")
    public ApiResponse<List<RevenueReportResponse>> getTopRoomTypes() {
        return ApiResponse.ok("Top room types by profit", reportService.getTopRoomTypesByProfit());
    }

    @GetMapping("/top-rooms")
    public ApiResponse<List<TopRoomResponse>> getTopRooms(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "4") Integer limit) {
        return ApiResponse.ok("Top rooms", roomService.getTopRooms(latitude, longitude, limit));
    }

    /**
     * GET /api/public/room-types?branchId=xxx
     * Returns active room types, optionally filtered by branch.
     * Used by ManagerRoomCreatePage to populate the room type dropdown.
     */
    @GetMapping("/room-types")
    public ApiResponse<List<Map<String, Object>>> getRoomTypes(
            @RequestParam(required = false) String branchId) {
        List<RoomTypeEntity> types;
        if (branchId != null && !branchId.isBlank()) {
            types = roomTypeRepository.findByBranchId(UUID.fromString(branchId));
        } else {
            types = roomTypeRepository.findAll();
        }
        List<Map<String, Object>> result = types.stream()
            .filter(RoomTypeEntity::isActive)
            .map(rt -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", rt.getId().toString());
                m.put("name", rt.getName());
                m.put("code", rt.getCode());
                m.put("branchId", rt.getBranchId() != null ? rt.getBranchId().toString() : null);
                m.put("capacity", rt.getCapacity());
                m.put("basePrice", rt.getBasePrice());
                return m;
            })
            .toList();
        return ApiResponse.ok("Room types", result);
    }

    @PostMapping("/payments/vnpay-ipn")
    public ApiResponse<VNPayCallbackResponse> vnpayIpn(
            @RequestParam java.util.Map<String, String> query) {
        return ApiResponse.ok("VNPay IPN processed", vnPayService.handleIpnCallback(query));
    }
}
