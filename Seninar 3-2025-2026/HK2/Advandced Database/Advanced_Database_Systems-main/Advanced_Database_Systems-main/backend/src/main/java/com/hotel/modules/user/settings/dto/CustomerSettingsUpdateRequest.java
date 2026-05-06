// commit: feat(settings-dto): thêm cameraDeviceId vào update request
package com.hotel.modules.user.settings.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomerSettingsUpdateRequest {

    @NotBlank
    private String theme;

    @NotBlank
    private String fontScale;

    private boolean allowLocation;
    private boolean allowCamera;

    /** Optional: preferred camera deviceId from browser MediaDevices API. */
    private String cameraDeviceId;

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
}
