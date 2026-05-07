package com.hotel.modules.room;

import java.util.UUID;

public interface RoomCoverImageProjection {
	UUID getRoomId();
	String getImageUrl();
}