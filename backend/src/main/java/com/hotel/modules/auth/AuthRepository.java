package com.hotel.modules.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import com.hotel.modules.user.ProfileEntity;
import com.hotel.modules.user.ProfileRepository;
import com.hotel.modules.user.UserBranchAssignmentRepository;
import com.hotel.modules.user.UserEntity;
import com.hotel.modules.user.UserRepository;

@Repository
public class AuthRepository {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserBranchAssignmentRepository userBranchAssignmentRepository;

    public AuthRepository(
        UserRepository userRepository,
        ProfileRepository profileRepository,
        UserBranchAssignmentRepository userBranchAssignmentRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userBranchAssignmentRepository = userBranchAssignmentRepository;
    }

    public Optional<UserEntity> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @SuppressWarnings("null")
    public @NonNull UserEntity saveUser(@NonNull UserEntity userEntity) {
        return userRepository.save(userEntity);
    }

    @SuppressWarnings("null")
    public @NonNull ProfileEntity saveProfile(@NonNull ProfileEntity profileEntity) {
        return profileRepository.save(profileEntity);
    }

    public Optional<ProfileEntity> findProfileByUserId(UUID userId) {
        return profileRepository.findByUserId(userId);
    }

    public Optional<UUID> findBranchIdByUserId(UUID userId) {
        return userBranchAssignmentRepository.findByUserId(userId)
            .map(assignment -> assignment.getBranchId());
    }

    /**
     * Find inactive, unverified accounts created before the given cutoff time.
     * Used by the cleanup scheduler to remove stale registrations.
     */
    public List<UserEntity> findInactiveUsersCreatedBefore(LocalDateTime cutoff) {
        return userRepository.findAllByActiveFalseAndEmailVerifiedFalseAndCreatedAtBefore(cutoff);
    }

    public void deleteProfileByUserId(UUID userId) {
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
    }

    public void deleteUser(UUID userId) {
        userRepository.deleteById(Objects.requireNonNull(userId, "userId"));
    }
}