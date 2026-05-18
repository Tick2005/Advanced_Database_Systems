package com.hotel.modules.user.settings;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerSettingsRepository extends JpaRepository<CustomerSettingsDocument, UUID> {

    Optional<CustomerSettingsDocument> findByUserId(UUID userId);

    long deleteByUserId(UUID userId);
}
