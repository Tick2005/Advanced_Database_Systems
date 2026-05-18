package com.hotel.modules.room.dto;

import java.math.BigDecimal;

public class RoomResponse {

	private String id;
	private String roomNumber;
	private String roomTypeId;
	private String roomTypeName;
	/** Mô tả loại phòng — map với room_types.description */
	private String description;
	private String branchId;
	private String branchCity;
	private String imageUrl;
	private String status;
	private BigDecimal rate;
	/** Giá hiệu lực sau khi áp pricing_season đang active (nếu có). Bằng rate nếu không có season. */
	private BigDecimal effectiveRate;
	/** Tên pricing_season đang áp dụng (null nếu không có) */
	private String activeSeasonName;
	/** % discount đang áp dụng (null nếu không có season; âm = tăng giá, dương = giảm giá) */
	private java.math.BigDecimal activeDiscountPercent;
	private int maxOccupancy;
	private double averageRating;
	private String notes;
	private Integer floor;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getRoomNumber() {
		return roomNumber;
	}

	public void setRoomNumber(String roomNumber) {
		this.roomNumber = roomNumber;
	}

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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getBranchId() {
		return branchId;
	}

	public void setBranchId(String branchId) {
		this.branchId = branchId;
	}

	public String getBranchCity() {
		return branchCity;
	}

	public void setBranchCity(String branchCity) {
		this.branchCity = branchCity;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public BigDecimal getRate() { return rate; }
	public void setRate(BigDecimal rate) { this.rate = rate; }

	public BigDecimal getEffectiveRate() { return effectiveRate; }
	public void setEffectiveRate(BigDecimal effectiveRate) { this.effectiveRate = effectiveRate; }

	public String getActiveSeasonName() { return activeSeasonName; }
	public void setActiveSeasonName(String activeSeasonName) { this.activeSeasonName = activeSeasonName; }

	public java.math.BigDecimal getActiveDiscountPercent() { return activeDiscountPercent; }
	public void setActiveDiscountPercent(java.math.BigDecimal activeDiscountPercent) { this.activeDiscountPercent = activeDiscountPercent; }

	public int getMaxOccupancy() {
		return maxOccupancy;
	}

	public void setMaxOccupancy(int maxOccupancy) {
		this.maxOccupancy = maxOccupancy;
	}

	public double getAverageRating() {
		return averageRating;
	}

	public void setAverageRating(double averageRating) {
		this.averageRating = averageRating;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Integer getFloor() {
		return floor;
	}

	public void setFloor(Integer floor) {
		this.floor = floor;
	}
}

