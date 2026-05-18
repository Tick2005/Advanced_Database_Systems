package com.hotel.modules.user.settings.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomerSettingsUpdateRequest {

    @NotBlank
    private String theme;

    @NotBlank
    private String fontScale;

    private boolean allowLocation;
    private boolean allowCamera;
    private boolean locationPermissionShown;

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getFontScale() {
        return fontScale;
    }

    public void setFontScale(String fontScale) {
        this.fontScale = fontScale;
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

    public boolean isLocationPermissionShown() {
        return locationPermissionShown;
    }

    public void setLocationPermissionShown(boolean locationPermissionShown) {
        this.locationPermissionShown = locationPermissionShown;
    }
}
