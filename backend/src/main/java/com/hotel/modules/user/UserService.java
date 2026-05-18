package com.hotel.modules.user;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.enums.Role;
import com.hotel.common.util.ValidationUtils;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.user.dto.ProfileResponse;
import com.hotel.modules.user.dto.UpdateProfileRequest;
import com.hotel.modules.user.dto.UserResponse;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserBranchAssignmentRepository userBranchAssignmentRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, ProfileRepository profileRepository, UserBranchAssignmentRepository userBranchAssignmentRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userBranchAssignmentRepository = userBranchAssignmentRepository;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toUserResponseWithBranch).toList();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public List<UserResponse> getUsersByBranch(String branchId) {
        java.util.UUID id = ValidationUtils.requireUuid(branchId, "branchId");
        List<java.util.UUID> userIds = userBranchAssignmentRepository.findByBranchId(id).stream()
            .map(UserBranchAssignmentEntity::getUserId)
            .toList();
        return userRepository.findAllById(userIds).stream()
            .map(this::toUserResponseWithBranch)
            .filter(user -> user.getBranchId() != null && user.getBranchId().equals(branchId))
            .filter(user -> Role.STAFF.name().equalsIgnoreCase(user.getRole()))
            .toList();
    }

    @Transactional
    @SuppressWarnings("null")
    public UserResponse updateRole(String userId, String role) {
        java.util.UUID id = ValidationUtils.requireUuid(userId, "userId");
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        try {
            user.setRole(Role.valueOf(role.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Unsupported role: " + role);
        }
        user.setUpdatedAt(LocalDateTime.now());
        return toUserResponseWithBranch(userRepository.save(user));
    }

    @Transactional
    @SuppressWarnings("null")
    public UserResponse updateActive(String userId, boolean active) {
        java.util.UUID id = ValidationUtils.requireUuid(userId, "userId");
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        user.setActive(active);
        user.setUpdatedAt(LocalDateTime.now());
        return toUserResponseWithBranch(userRepository.save(user));
    }

    @Transactional
    @SuppressWarnings("null")
    public UserResponse updateBranch(String userId, String branchId) {
        java.util.UUID id = ValidationUtils.requireUuid(userId, "userId");
        java.util.UUID branchUuid = ValidationUtils.requireUuid(branchId, "branchId");
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        UserBranchAssignmentEntity assignment = userBranchAssignmentRepository.findByUserId(id)
            .orElseGet(() -> {
                UserBranchAssignmentEntity entity = new UserBranchAssignmentEntity();
                entity.setUserId(id);
                entity.setCreatedAt(LocalDateTime.now());
                return entity;
            });
        assignment.setBranchId(branchUuid);
        assignment.setUpdatedAt(LocalDateTime.now());
        userBranchAssignmentRepository.save(assignment);

        user.setUpdatedAt(LocalDateTime.now());
        return toUserResponseWithBranch(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public ProfileResponse getProfile(String userId) {
        java.util.UUID id = ValidationUtils.requireUuid(userId, "userId");
        UserEntity user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + userId));
        ProfileEntity profile = profileRepository.findByUserId(id)
            .orElseThrow(() -> new NotFoundException("Profile not found for user: " + userId));
        return userMapper.toProfileResponse(profile, user);
    }

    @Transactional
    @SuppressWarnings("null")
    public ProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        java.util.UUID id = ValidationUtils.requireUuid(userId, "userId");
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

    private UserResponse toUserResponseWithBranch(UserEntity user) {
        UserResponse response = userMapper.toUserResponse(user);
        
        profileRepository.findByUserId(user.getId()).ifPresent(profile -> {
            response.setFullName(profile.getFullName());
            response.setPhone(profile.getPhone());
        });

        userBranchAssignmentRepository.findByUserId(user.getId())
            .map(UserBranchAssignmentEntity::getBranchId)
            .map(java.util.UUID::toString)
            .ifPresent(response::setBranchId);
        return response;
    }
}