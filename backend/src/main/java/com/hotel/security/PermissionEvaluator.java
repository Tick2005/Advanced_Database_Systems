package com.hotel.security;

import org.springframework.stereotype.Component;

@Component
public class PermissionEvaluator {

    private final SecurityUtils securityUtils;

    public PermissionEvaluator(SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
    }

    public boolean isOwnUserResource(String userId) {
        CurrentUser currentUser = securityUtils.getCurrentUser();
        return currentUser != null && currentUser.getUserId() != null && currentUser.getUserId().equals(userId);
    }
}