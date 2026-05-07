package com.hotel.modules.report.dto;

public class RevenueReportResponse {

    private String roomTypeId;
    private String roomTypeName;
    private String branchId;
    private String branchName;
    private String revenueQuarter;
    private double totalRevenue;
    private int profitRank;

    public String getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(String roomTypeId) {
        this.roomTypeId = roomTypeId;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public void setRoomTypeName(String roomTypeName) {
        this.roomTypeName = roomTypeName;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getRevenueQuarter() {
        return revenueQuarter;
    }

    public void setRevenueQuarter(String revenueQuarter) {
        this.revenueQuarter = revenueQuarter;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public int getProfitRank() {
        return profitRank;
    }

    public void setProfitRank(int profitRank) {
        this.profitRank = profitRank;
    }
}