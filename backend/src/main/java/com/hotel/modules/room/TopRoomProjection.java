package com.hotel.modules.room;

import java.math.BigDecimal;

public interface TopRoomProjection {
	String getRoomId();
	String getRoomNumber();
	Double getAverageRating();
	Double getScore();
	BigDecimal getRate();
	String getStatus();
	Integer getMaxOccupancy();
	String getRoomTypeId();
	String getRoomTypeName();
	String getBranchId();
	String getBranchName();
	String getBranchCity();
	Double getBranchLatitude();
	Double getBranchLongitude();
	Double getDistanceKm();
}
