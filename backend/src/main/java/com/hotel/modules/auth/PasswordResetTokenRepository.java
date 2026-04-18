package com.hotel.modules.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetTokenDocument, String> {

    Optional<PasswordResetTokenDocument> findFirstByEmailAndTokenHashAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
        String email,
        String tokenHash,
        Instant now
    );
}
