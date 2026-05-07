package com.hotel.modules.dashboard.dto;

import com.hotel.modules.report.dto.ConversionSummaryResponse;

public class DashboardSummaryResponse {

    private int activeBranchCount;
    private ConversionSummaryResponse conversion;

    public int getActiveBranchCount() {
        return activeBranchCount;
    }

    public void setActiveBranchCount(int activeBranchCount) {
        this.activeBranchCount = activeBranchCount;
    }

    public ConversionSummaryResponse getConversion() {
        return conversion;
    }

    public void setConversion(ConversionSummaryResponse conversion) {
        this.conversion = conversion;
    }
}
