package com.hotel.controllers.publicapi;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomSearchFilter;
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

    public PublicController(
        RoomService roomService,
        BranchService branchService,
        FeedbackService feedbackService,
        ReportService reportService,
        ServiceService serviceService,
        VNPayService vnPayService
    ) {
        this.roomService = roomService;
        this.branchService = branchService;
        this.feedbackService = feedbackService;
        this.reportService = reportService;
        this.serviceService = serviceService;
        this.vnPayService = vnPayService;
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

    @PostMapping("/feedbacks/summary")
    public ApiResponse<List<RoomFeedbackSummaryResponse>> getRoomFeedbackSummaries(@RequestBody Map<String, List<String>> payload) {
        List<String> roomIds = payload == null ? List.of() : payload.getOrDefault("roomIds", List.of());
        return ApiResponse.ok("Room feedback summaries", feedbackService.getRoomSummaries(roomIds));
    }

    @GetMapping("/top-room-types")
    public ApiResponse<List<RevenueReportResponse>> getTopRoomTypes() {
        return ApiResponse.ok("Top room types by profit", reportService.getTopRoomTypesByProfit());
    }

    @PostMapping("/payments/vnpay-ipn")
    public ApiResponse<VNPayCallbackResponse> vnpayIpn(@RequestParam java.util.Map<String, String> query) {
        return ApiResponse.ok("VNPay IPN processed", vnPayService.handleIpnCallback(query));
    }
}
