package com.hotel.modules.user.settings;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerSettingsRepository extends MongoRepository<CustomerSettingsDocument, String> {

    Optional<CustomerSettingsDocument> findByUserId(String userId);
}
