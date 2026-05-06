// commit: feat(settings-service): persist cameraDeviceId, normalize inputs, add createDefaultSettings guard
package com.hotel.modules.user.settings;

import java.time.Instant;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.hotel.modules.user.settings.dto.CustomerSettingsResponse;
import com.hotel.modules.user.settings.dto.CustomerSettingsUpdateRequest;

/**
 * Manages per-user UX settings stored in MongoDB ({@code customer_settings} collection).
 *
 * <ul>
 *   <li>Auto-creates a default document on first access.</li>
 *   <li>Normalises theme and fontScale to a known-good set of values.</li>
 *   <li>Persists optional {@code cameraDeviceId} for camera profile support.</li>
 * </ul>
 */
@Service
public class CustomerSettingsService {

    private static final Set<String> VALID_THEMES      = Set.of("light", "dark");
    private static final Set<String> VALID_FONT_SCALES = Set.of("compact", "normal", "large");

    private final CustomerSettingsRepository customerSettingsRepository;

    public CustomerSettingsService(CustomerSettingsRepository customerSettingsRepository) {
        this.customerSettingsRepository = customerSettingsRepository;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public CustomerSettingsResponse getByUserId(String userId) {
        CustomerSettingsDocument document = customerSettingsRepository.findByUserId(userId)
            .orElseGet(() -> createDefaultSettings(userId));
        return toResponse(document);
    }

    public CustomerSettingsResponse updateByUserId(String userId, CustomerSettingsUpdateRequest request) {
        CustomerSettingsDocument document = customerSettingsRepository.findByUserId(userId)
            .orElseGet(() -> createDefaultSettings(userId));

        document.setTheme(normalizeTheme(request.getTheme()));
        document.setFontScale(normalizeFontScale(request.getFontScale()));
        document.setAllowLocation(request.isAllowLocation());
        document.setAllowCamera(request.isAllowCamera());
        // Persist camera device selection (null clears the stored preference)
        document.setCameraDeviceId(sanitiseCameraDeviceId(request.getCameraDeviceId()));
        document.setUpdatedAt(Instant.now());

        return toResponse(customerSettingsRepository.save(document));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private CustomerSettingsDocument createDefaultSettings(String userId) {
        CustomerSettingsDocument document = new CustomerSettingsDocument();
        document.setUserId(userId);
        document.setTheme("light");
        document.setFontScale("normal");
        document.setAllowLocation(true);
        document.setAllowCamera(true);
        document.setCameraDeviceId(null);
        Instant now = Instant.now();
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        return customerSettingsRepository.save(document);
    }

    private CustomerSettingsResponse toResponse(CustomerSettingsDocument doc) {
        CustomerSettingsResponse response = new CustomerSettingsResponse();
        response.setTheme(doc.getTheme() == null ? "light" : doc.getTheme());
        response.setFontScale(doc.getFontScale() == null ? "normal" : doc.getFontScale());
        response.setAllowLocation(doc.isAllowLocation());
        response.setAllowCamera(doc.isAllowCamera());
        response.setCameraDeviceId(doc.getCameraDeviceId());
        return response;
    }

    private String normalizeTheme(String value) {
        if (value == null) return "light";
        String v = value.trim().toLowerCase();
        return VALID_THEMES.contains(v) ? v : "light";
    }

    private String normalizeFontScale(String value) {
        if (value == null) return "normal";
        String v = value.trim().toLowerCase();
        return VALID_FONT_SCALES.contains(v) ? v : "normal";
    }

    /**
     * Trim whitespace; return null for blank strings so the field is cleared cleanly.
     * Device IDs can technically contain almost any character, so we don't validate further.
     */
    private String sanitiseCameraDeviceId(String deviceId) {
        if (deviceId == null) return null;
        String trimmed = deviceId.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
