package com.hotel.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserBranchAssignmentRepository extends JpaRepository<UserBranchAssignmentEntity, UUID> {

    Optional<UserBranchAssignmentEntity> findByUserId(UUID userId);
}