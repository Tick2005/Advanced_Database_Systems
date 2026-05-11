package com.hotel.modules.room;

import java.math.BigDecimal;

public interface TopRoomProjection {
	String getRoom_id();
	String getRoom_number();
	Double getAverage_rating();
	BigDecimal getRate();
	String getStatus();
	Integer getMax_occupancy();
	String getRoom_type_id();
	String getRoom_type_name();
	String getBranch_id();
	String getBranch_name();
	String getBranch_city();
	Double getBranch_latitude();
	Double getBranch_longitude();
	Double getDistance_km();
}
