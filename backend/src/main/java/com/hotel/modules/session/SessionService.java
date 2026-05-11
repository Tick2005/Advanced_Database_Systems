package com.hotel.modules.session;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for managing user sessions with MongoDB persistence
 * - Creates and validates sessions
 * - Tracks device info for security
 * - Manages session expiration
 */
@Service
public class SessionService {

    private final SessionRepository sessionRepository;

    @Value("${app.session.timeout-minutes:480}")
    private int sessionTimeoutMinutes; // Default 8 hours

    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Create a new session for a user
     */
    public SessionDocument createSession(String userId, String ipAddress, String userAgent, String browser, String os) {
        SessionDocument session = new SessionDocument();
        session.setUserId(userId);
        session.setSessionToken(generateSessionToken());
        session.setIpAddress(ipAddress);
        session.setCreatedAt(Instant.now());

        // Device info tracking
        Map<String, Object> deviceInfo = new HashMap<>();
        deviceInfo.put("userAgent", userAgent);
        deviceInfo.put("browser", browser);
        deviceInfo.put("os", os);
        deviceInfo.put("createdAt", Instant.now());
        session.setDeviceInfo(deviceInfo);

        // Set expiration time
        Instant expiresAt = Instant.now().plus(sessionTimeoutMinutes, ChronoUnit.MINUTES);
        session.setExpiresAt(expiresAt);
        session.setLastActivityAt(Instant.now());

        return sessionRepository.save(session);
    }

    /**
     * Validate session exists and is not expired
     */
    public SessionDocument validateSession(String userId, String sessionToken) {
        return sessionRepository.findByUserIdAndSessionToken(userId, sessionToken)
            .filter(s -> s.getExpiresAt().isAfter(Instant.now()))
            .orElse(null);
    }

    /**
     * Update last activity timestamp (called on each request)
     */
    public void updateLastActivity(String sessionToken) {
        sessionRepository.findBySessionToken(sessionToken).ifPresent(session -> {
            session.setLastActivityAt(Instant.now());
            // Extend session if nearing expiration (15 minutes before)
            if (session.getExpiresAt().minus(15, ChronoUnit.MINUTES).isBefore(Instant.now())) {
                Instant newExpiry = Instant.now().plus(sessionTimeoutMinutes, ChronoUnit.MINUTES);
                session.setExpiresAt(newExpiry);
            }
            sessionRepository.save(session);
        });
    }

    /**
     * Get all sessions for a user (device tracking)
     */
    public List<SessionDocument> getUserSessions(String userId) {
        return sessionRepository.findByUserId(userId);
    }

    /**
     * Logout - delete session
     */
    public void invalidateSession(String sessionToken) {
        sessionRepository.findBySessionToken(sessionToken).ifPresent(sessionRepository::delete);
    }

    /**
     * Logout from all devices
     */
    public void invalidateAllSessions(String userId) {
        sessionRepository.deleteByUserId(userId);
    }

    /**
     * Generate unique session token
     */
    private String generateSessionToken() {
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }
}
