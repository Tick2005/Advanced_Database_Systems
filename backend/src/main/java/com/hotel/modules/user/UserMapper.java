package com.hotel.modules.user;

import com.hotel.modules.user.dto.ProfileResponse;
import com.hotel.modules.user.dto.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toUserResponse(UserEntity user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId().toString());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setActive(user.isActive());
        response.setEmailVerified(user.isEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    public ProfileResponse toProfileResponse(ProfileEntity profile, UserEntity user) {
        ProfileResponse response = new ProfileResponse();
        response.setUserId(user.getId().toString());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setFullName(profile.getFullName());
        response.setPhone(profile.getPhone());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setAddress(profile.getAddress());
        response.setPreferredLanguage(profile.getPreferredLanguage());
        return response;
    }
}