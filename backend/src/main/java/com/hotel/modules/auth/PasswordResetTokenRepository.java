package com.hotel.modules.auth;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetTokenDocument, String> {

    Optional<PasswordResetTokenDocument> findFirstByEmailAndTokenHashAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
        String email,
        String tokenHash,
        Instant now
    );

    long deleteByEmail(String email);
}
