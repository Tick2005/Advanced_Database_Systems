package com.hotel.modules.user.dto;

import jakarta.validation.constraints.NotBlank;

public class RoleUpdateRequest {

    @NotBlank
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
