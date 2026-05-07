package com.hotel.modules.room.dto;

import jakarta.validation.constraints.NotBlank;

public class RoomStatusUpdateRequest {

    @NotBlank
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
