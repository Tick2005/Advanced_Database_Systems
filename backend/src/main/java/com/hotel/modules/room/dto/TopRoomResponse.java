package com.hotel.modules.room.dto;

import java.math.BigDecimal;

public class TopRoomResponse {

	private String id;
	private String roomNumber;
	private String roomTypeId;
	private String roomTypeName;
	private String branchId;
	private String branchName;
	private String branchCity;
	private Double branchLatitude;
	private Double branchLongitude;
	private String imageUrl;
	private String status;
	private BigDecimal rate;
	private int maxOccupancy;
	private double averageRating;
	private Double score;
	private Double distanceKm;  // Nullable - only populated when location provided

	public TopRoomResponse() {}

	public TopRoomResponse(String id, String roomNumber, Double averageRating,
			BigDecimal rate, String status, Integer maxOccupancy,
			String roomTypeId, String roomTypeName,
			String branchId, String branchName, String branchCity,
			Double branchLatitude, Double branchLongitude,
			Double score,
			Double distanceKm) {
		this.id = id;
		this.roomNumber = roomNumber;
		this.averageRating = averageRating;
		this.score = score;
		this.rate = rate;
		this.status = status;
		this.maxOccupancy = maxOccupancy;
		this.roomTypeId = roomTypeId;
		this.roomTypeName = roomTypeName;
		this.branchId = branchId;
		this.branchName = branchName;
		this.branchCity = branchCity;
		this.branchLatitude = branchLatitude;
		this.branchLongitude = branchLongitude;
		this.distanceKm = distanceKm;
	}

	public TopRoomResponse(String id, String roomNumber, Double averageRating,
			BigDecimal rate, String status, Integer maxOccupancy,
			String roomTypeId, String roomTypeName,
			String branchId, String branchName, String branchCity,
			Double branchLatitude, Double branchLongitude,
			Double distanceKm) {
		this(id, roomNumber, averageRating, rate, status, maxOccupancy, roomTypeId, roomTypeName, branchId, branchName, branchCity, branchLatitude, branchLongitude, null, distanceKm);
	}

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

	public String getBranchCity() {
		return branchCity;
	}

	public void setBranchCity(String branchCity) {
		this.branchCity = branchCity;
	}

	public Double getBranchLatitude() {
		return branchLatitude;
	}

	public void setBranchLatitude(Double branchLatitude) {
		this.branchLatitude = branchLatitude;
	}

	public Double getBranchLongitude() {
		return branchLongitude;
	}

	public void setBranchLongitude(Double branchLongitude) {
		this.branchLongitude = branchLongitude;
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

	public BigDecimal getRate() {
		return rate;
	}

	public void setRate(BigDecimal rate) {
		this.rate = rate;
	}

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

	public Double getDistanceKm() {
		return distanceKm;
	}

	public void setDistanceKm(Double distanceKm) {
		this.distanceKm = distanceKm;
	}

	public Double getScore() {
		return score;
	}

	public void setScore(Double score) {
		this.score = score;
	}
}
