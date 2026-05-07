package com.hotel.modules.pricing.request;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PricingRequestRepository extends JpaRepository<PricingRequestEntity, UUID> {

    List<PricingRequestEntity> findAllByOrderByCreatedAtDesc();
}