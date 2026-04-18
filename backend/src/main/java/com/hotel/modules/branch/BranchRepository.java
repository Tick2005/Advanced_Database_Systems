package com.hotel.modules.branch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BranchRepository extends JpaRepository<BranchEntity, UUID> {

    List<BranchEntity> findByActiveTrueOrderByCreatedAtDesc();
}