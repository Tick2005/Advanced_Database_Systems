package com.hotel.modules.pricing.pricing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PricingRepository extends JpaRepository<PricingEntity, UUID> {

    List<PricingEntity> findByActiveTrueOrderByCreatedAtDesc();

    boolean existsByBranchIdAndActiveTrueAndStartsOnLessThanEqualAndEndsOnGreaterThanEqual(
        UUID branchId,
        LocalDate endsOn,
        LocalDate startsOn
    );
}