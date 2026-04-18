package com.hotel.modules.auth;

import com.hotel.modules.user.ProfileEntity;
import com.hotel.modules.user.ProfileRepository;
import com.hotel.modules.user.UserBranchAssignmentRepository;
import com.hotel.modules.user.UserEntity;
import com.hotel.modules.user.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

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

    public UserEntity saveUser(UserEntity userEntity) {
        return userRepository.save(userEntity);
    }

    public ProfileEntity saveProfile(ProfileEntity profileEntity) {
        return profileRepository.save(profileEntity);
    }

    public Optional<ProfileEntity> findProfileByUserId(UUID userId) {
        return profileRepository.findByUserId(userId);
    }

    public Optional<UUID> findBranchIdByUserId(UUID userId) {
        return userBranchAssignmentRepository.findByUserId(userId)
            .map(assignment -> assignment.getBranchId());
    }
}
