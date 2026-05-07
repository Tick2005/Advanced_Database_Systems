package com.hotel.security;

public class CurrentUser {

    private final String userId;
    private final String email;
    private final String role;
    private final String branchId;

    public CurrentUser(String userId, String email, String role, String branchId) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.branchId = branchId;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getBranchId() {
        return branchId;
    }
}