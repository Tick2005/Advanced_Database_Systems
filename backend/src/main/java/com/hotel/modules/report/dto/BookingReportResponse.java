package com.hotel.modules.report.dto;

public class BookingReportResponse {

    private String roomId;
    private String branchId;
    private String revenueQuarter;
    private double totalRevenue;
    private int bookingCount;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
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

    public int getBookingCount() {
        return bookingCount;
    }

    public void setBookingCount(int bookingCount) {
        this.bookingCount = bookingCount;
    }
}