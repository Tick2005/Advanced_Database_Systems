package com.hotel.modules.pricing.log;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PricingLogRepository extends JpaRepository<PricingLogEntity, Long> {

    List<PricingLogEntity> findTop20ByOrderByChangedAtDesc();
}