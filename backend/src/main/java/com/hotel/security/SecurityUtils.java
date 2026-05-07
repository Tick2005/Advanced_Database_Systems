package com.hotel.security;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        String email = String.valueOf(authentication.getPrincipal());
        String userId = null;
        String role = null;
        String branchId = null;

        if (authentication.getDetails() instanceof Claims claims) {
            userId = String.valueOf(claims.getOrDefault("uid", ""));
            role = String.valueOf(claims.getOrDefault("role", "CUSTOMER"));
            Object branch = claims.get("branchId");
            if (branch != null) {
                branchId = String.valueOf(branch);
            }
        }

        if (role == null && !authentication.getAuthorities().isEmpty()) {
            role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        }

        return new CurrentUser(userId, email, role, branchId);
    }
}