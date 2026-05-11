package com.hotel.modules.session;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * MongoDB repository for session management
 * - Stores active user sessions with device tracking
 * - TTL index on expires_at field removes expired sessions automatically
 */
@Repository
public interface SessionRepository extends MongoRepository<SessionDocument, String> {

    /**
     * Find all sessions for a user (across devices)
     */
    List<SessionDocument> findByUserId(String userId);

    /**
     * Find session by token for validation
     */
    Optional<SessionDocument> findBySessionToken(String sessionToken);

    /**
     * Find session by user and token
     */
    Optional<SessionDocument> findByUserIdAndSessionToken(String userId, String sessionToken);

    /**
     * Delete all expired sessions for a user
     */
    long deleteByUserId(String userId);
}
