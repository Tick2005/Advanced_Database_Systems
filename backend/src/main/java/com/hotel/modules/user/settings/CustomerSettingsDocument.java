package com.hotel.modules.user.settings;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_settings")
public class CustomerSettingsDocument {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    private String theme;

    @Column(name = "allow_location")
    private boolean allowLocation;

    @Column(name = "allow_camera")
    private boolean allowCamera;

    @Column(name = "font_scale")
    private String fontScale;

    @Column(name = "location_permission_shown")
    private boolean locationPermissionShown;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public boolean isAllowLocation() {
        return allowLocation;
    }

    public void setAllowLocation(boolean allowLocation) {
        this.allowLocation = allowLocation;
    }

    public boolean isAllowCamera() {
        return allowCamera;
    }

    public void setAllowCamera(boolean allowCamera) {
        this.allowCamera = allowCamera;
    }

    public String getFontScale() {
        return fontScale;
    }

    public void setFontScale(String fontScale) {
        this.fontScale = fontScale;
    }

    public boolean isLocationPermissionShown() {
        return locationPermissionShown;
    }

    public void setLocationPermissionShown(boolean locationPermissionShown) {
        this.locationPermissionShown = locationPermissionShown;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
