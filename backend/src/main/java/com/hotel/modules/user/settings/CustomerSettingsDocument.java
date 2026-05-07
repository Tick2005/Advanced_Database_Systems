package com.hotel.modules.user.settings;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "customer_settings")
public class CustomerSettingsDocument {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    private String theme;

    @Field("allow_location")
    private boolean allowLocation;

    @Field("allow_camera")
    private boolean allowCamera;

    @Field("font_scale")
    private String fontScale;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

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
