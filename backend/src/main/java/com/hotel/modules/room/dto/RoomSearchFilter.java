package com.hotel.modules.room.dto;

import java.math.BigDecimal;

public class RoomSearchFilter {

	private String branchId;
	private String roomTypeId;
	private String status;
	private BigDecimal minPrice;
	private BigDecimal maxPrice;
	private Double minRating;

	public String getBranchId() {
		return branchId;
	}

	public void setBranchId(String branchId) {
		this.branchId = branchId;
	}

	public String getRoomTypeId() {
		return roomTypeId;
	}

	public void setRoomTypeId(String roomTypeId) {
		this.roomTypeId = roomTypeId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public BigDecimal getMinPrice() {
		return minPrice;
	}

	public void setMinPrice(BigDecimal minPrice) {
		this.minPrice = minPrice;
	}

	public BigDecimal getMaxPrice() {
		return maxPrice;
	}

	public void setMaxPrice(BigDecimal maxPrice) {
		this.maxPrice = maxPrice;
	}

	public Double getMinRating() {
		return minRating;
	}

	public void setMinRating(Double minRating) {
		this.minRating = minRating;
	}
}

