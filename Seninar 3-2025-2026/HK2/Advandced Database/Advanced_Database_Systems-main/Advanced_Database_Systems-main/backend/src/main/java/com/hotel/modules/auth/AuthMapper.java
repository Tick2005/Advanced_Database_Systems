package com.hotel.modules.auth;

import com.hotel.modules.auth.dto.AuthResponse;
import com.hotel.modules.user.UserEntity;
import com.hotel.security.JwtProvider;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    private final JwtProvider jwtProvider;

    public AuthMapper(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    public AuthResponse toAuthResponse(UserEntity user) {
        return toAuthResponse(user, null);
    }

    public AuthResponse toAuthResponse(UserEntity user, String branchId) {
        String userId = user.getId().toString();
        String email = user.getEmail();
        String role = user.getRole().name();

        String accessToken = jwtProvider.generateAccessToken(userId, email, role, branchId);
        String refreshToken = jwtProvider.generateRefreshToken(userId, email, role, branchId);
        return new AuthResponse(accessToken, refreshToken, role, email);
    }
}
