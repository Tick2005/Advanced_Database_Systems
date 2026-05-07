package com.hotel.modules.auth.dto;

public class AuthActionResponse {

    private boolean success;

    public AuthActionResponse() {
    }

    public AuthActionResponse(boolean success) {
        this.success = success;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
