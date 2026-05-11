package com.hotel.modules.session;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Session document stored in MongoDB
 * - Tracks active user sessions across devices
 * - Includes device info for security tracking
 * - TTL index ensures automatic expiration
 */
@Document(collection = "sessions")
public class SessionDocument {

    @Id
    private String id; // MongoDB ObjectId or custom session ID

    @Field("user_id")
    private String userId; // Reference to user UUID

    @Field("session_token")
    private String sessionToken; // Unique session token

    @Field("device_info")
    private Map<String, Object> deviceInfo; // Browser, OS, User-Agent

    @Field("ip_address")
    private String ipAddress; // Client IP for security audit

    @Field("last_activity_at")
    private Instant lastActivityAt; // Last request timestamp

    @Field("created_at")
    private Instant createdAt; // Session creation time

    @Field("expires_at")
    private Instant expiresAt; // Session expiration (TTL index)

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public Map<String, Object> getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(Map<String, Object> deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(Instant lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
