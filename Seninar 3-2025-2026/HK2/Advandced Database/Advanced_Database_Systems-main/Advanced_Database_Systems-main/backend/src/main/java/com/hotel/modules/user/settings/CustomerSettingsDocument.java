// commit: feat(settings-document): thêm trường cameraDeviceId để lưu camera profile
package com.hotel.modules.user.settings;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * MongoDB document storing per-user UX settings.
 * Stored in the {@code customer_settings} collection.
 */
@Document(collection = "customer_settings")
public class CustomerSettingsDocument {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    /** UI colour scheme: "light" | "dark". */
    private String theme;

    /** Preferred font scale: "compact" | "normal" | "large". */
    @Field("font_scale")
    private String fontScale;

    /** Whether the user granted the app permission to read device location. */
    @Field("allow_location")
    private boolean allowLocation;

    /** Whether the user granted the app permission to access the camera. */
    @Field("allow_camera")
    private boolean allowCamera;

    /**
     * Preferred camera deviceId (browser MediaDevices label).
     * Null means the system default camera is used.
     */
    @Field("camera_device_id")
    private String cameraDeviceId;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getFontScale() { return fontScale; }
    public void setFontScale(String fontScale) { this.fontScale = fontScale; }

    public boolean isAllowLocation() { return allowLocation; }
    public void setAllowLocation(boolean allowLocation) { this.allowLocation = allowLocation; }

    public boolean isAllowCamera() { return allowCamera; }
    public void setAllowCamera(boolean allowCamera) { this.allowCamera = allowCamera; }

    public String getCameraDeviceId() { return cameraDeviceId; }
    public void setCameraDeviceId(String cameraDeviceId) { this.cameraDeviceId = cameraDeviceId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
