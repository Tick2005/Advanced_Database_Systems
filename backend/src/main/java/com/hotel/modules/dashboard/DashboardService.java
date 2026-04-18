package com.hotel.modules.dashboard;

import com.hotel.modules.branch.BranchService;
import com.hotel.modules.dashboard.dto.DashboardSummaryResponse;
import com.hotel.modules.report.ReportService;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final BranchService branchService;
    private final ReportService reportService;

    public DashboardService(BranchService branchService, ReportService reportService) {
        this.branchService = branchService;
        this.reportService = reportService;
    }

    public DashboardSummaryResponse getOwnerSummary() {
        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setActiveBranchCount(branchService.getActiveBranches().size());
        response.setConversion(reportService.getConversionSummary());
        return response;
    }
}
