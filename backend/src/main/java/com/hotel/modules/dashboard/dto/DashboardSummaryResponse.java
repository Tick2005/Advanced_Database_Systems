package com.hotel.modules.dashboard.dto;

import com.hotel.modules.report.dto.ConversionSummaryResponse;
import java.util.List;
import java.util.Map;

public class DashboardSummaryResponse {

    private int activeBranchCount;
    private ConversionSummaryResponse conversion;

    // Financial KPIs (year-to-date)
    private double revenueYtd;
    private double costYtd;       // estimated cost = revenue * 0.70
    private double profitYtd;     // estimated profit = revenue * 0.30
    private Double profitMargin;  // percentage

    // Monthly revenue series for YoY chart: [{period, yearA, yearB}]
    private List<Map<String, Object>> revenueSeries;

    // Booking heatmap for current month: [{day, count}]
    private List<Map<String, Object>> bookingHeatmap;

    // Branch KPI metrics for radar chart
    private Map<String, Object> kpiMetrics;

    // Doanh thu 6 tháng theo từng chi nhánh: [{period, branchName1: rev, branchName2: rev, ...}]
    private List<Map<String, Object>> branchRevenueSeries;

    // ── getters / setters ──────────────────────────────────────────────

    public int getActiveBranchCount() { return activeBranchCount; }
    public void setActiveBranchCount(int activeBranchCount) { this.activeBranchCount = activeBranchCount; }

    public ConversionSummaryResponse getConversion() { return conversion; }
    public void setConversion(ConversionSummaryResponse conversion) { this.conversion = conversion; }

    public double getRevenueYtd() { return revenueYtd; }
    public void setRevenueYtd(double revenueYtd) { this.revenueYtd = revenueYtd; }

    public double getCostYtd() { return costYtd; }
    public void setCostYtd(double costYtd) { this.costYtd = costYtd; }

    public double getProfitYtd() { return profitYtd; }
    public void setProfitYtd(double profitYtd) { this.profitYtd = profitYtd; }

    public Double getProfitMargin() { return profitMargin; }
    public void setProfitMargin(Double profitMargin) { this.profitMargin = profitMargin; }

    public List<Map<String, Object>> getRevenueSeries() { return revenueSeries; }
    public void setRevenueSeries(List<Map<String, Object>> revenueSeries) { this.revenueSeries = revenueSeries; }

    public List<Map<String, Object>> getBookingHeatmap() { return bookingHeatmap; }
    public void setBookingHeatmap(List<Map<String, Object>> bookingHeatmap) { this.bookingHeatmap = bookingHeatmap; }

    public Map<String, Object> getKpiMetrics() { return kpiMetrics; }
    public void setKpiMetrics(Map<String, Object> kpiMetrics) { this.kpiMetrics = kpiMetrics; }

    public List<Map<String, Object>> getBranchRevenueSeries() { return branchRevenueSeries; }
    public void setBranchRevenueSeries(List<Map<String, Object>> branchRevenueSeries) { this.branchRevenueSeries = branchRevenueSeries; }
}
