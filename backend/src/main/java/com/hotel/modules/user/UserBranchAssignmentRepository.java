package com.hotel.modules.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBranchAssignmentRepository extends JpaRepository<UserBranchAssignmentEntity, UUID> {

    Optional<UserBranchAssignmentEntity> findByUserId(UUID userId);

    List<UserBranchAssignmentEntity> findByBranchId(UUID branchId);
}