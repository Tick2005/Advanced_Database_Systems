package com.hotel.modules.room.dto;

import java.math.BigDecimal;

public class RoomSearchFilter {

	private String branchId;
	private String roomTypeId;
	/** Lọc theo tên loại phòng (Standard / Deluxe / Family) — không phân biệt hoa thường */
	private String roomTypeName;
	private String status;
	private java.math.BigDecimal minPrice;
	private java.math.BigDecimal maxPrice;
	private Double minRating;

	public String getBranchId() { return branchId; }
	public void setBranchId(String branchId) { this.branchId = branchId; }

	public String getRoomTypeId() { return roomTypeId; }
	public void setRoomTypeId(String roomTypeId) { this.roomTypeId = roomTypeId; }

	public String getRoomTypeName() { return roomTypeName; }
	public void setRoomTypeName(String roomTypeName) { this.roomTypeName = roomTypeName; }

	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }

	public java.math.BigDecimal getMinPrice() { return minPrice; }
	public void setMinPrice(java.math.BigDecimal minPrice) { this.minPrice = minPrice; }

	public java.math.BigDecimal getMaxPrice() { return maxPrice; }
	public void setMaxPrice(java.math.BigDecimal maxPrice) { this.maxPrice = maxPrice; }

	public Double getMinRating() { return minRating; }
	public void setMinRating(Double minRating) { this.minRating = minRating; }
}

