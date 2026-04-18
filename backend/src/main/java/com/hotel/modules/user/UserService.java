package com.hotel.modules.user;

import com.hotel.common.enums.Role;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.user.dto.ProfileResponse;
import com.hotel.modules.user.dto.UpdateProfileRequest;
import com.hotel.modules.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, ProfileRepository profileRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(userMapper::toUserResponse).toList();
    }

    @Transactional
    public UserResponse updateRole(String userId, String role) {
        UserEntity user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        user.setRole(Role.valueOf(role.toUpperCase()));
        user.setUpdatedAt(LocalDateTime.now());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String userId) {
        UUID id = UUID.fromString(userId);
        UserEntity user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + userId));
        ProfileEntity profile = profileRepository.findByUserId(id)
            .orElseThrow(() -> new NotFoundException("Profile not found for user: " + userId));
        return userMapper.toProfileResponse(profile, user);
    }

    @Transactional
    public ProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        UUID id = UUID.fromString(userId);
        UserEntity user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + userId));
        ProfileEntity profile = profileRepository.findByUserId(id).orElseGet(() -> {
            ProfileEntity entity = new ProfileEntity();
            entity.setUserId(id);
            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        });

        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress());
        }
        if (request.getPreferredLanguage() != null) {
            profile.setPreferredLanguage(request.getPreferredLanguage());
        }
        profile.setUpdatedAt(LocalDateTime.now());

        ProfileEntity saved = profileRepository.save(profile);
        return userMapper.toProfileResponse(saved, user);
    }
}