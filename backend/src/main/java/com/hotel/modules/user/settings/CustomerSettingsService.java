package com.hotel.modules.user.settings;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.hotel.modules.user.settings.dto.CustomerSettingsResponse;
import com.hotel.modules.user.settings.dto.CustomerSettingsUpdateRequest;

@Service
public class CustomerSettingsService {

    private final CustomerSettingsRepository customerSettingsRepository;

    public CustomerSettingsService(CustomerSettingsRepository customerSettingsRepository) {
        this.customerSettingsRepository = customerSettingsRepository;
    }

    public CustomerSettingsResponse getByUserId(String userId) {
        CustomerSettingsDocument document = customerSettingsRepository.findByUserId(java.util.UUID.fromString(userId))
            .orElseGet(() -> createDefaultSettings(userId));
        return toResponse(document);
    }

    public CustomerSettingsResponse updateByUserId(String userId, CustomerSettingsUpdateRequest request) {
        CustomerSettingsDocument document = customerSettingsRepository.findByUserId(java.util.UUID.fromString(userId))
            .orElseGet(() -> createDefaultSettings(userId));

        document.setTheme(normalizeTheme(request.getTheme()));
        document.setFontScale(normalizeFontScale(request.getFontScale()));
        document.setAllowLocation(request.isAllowLocation());
        document.setAllowCamera(request.isAllowCamera());
        document.setLocationPermissionShown(request.isLocationPermissionShown());
        document.setUpdatedAt(Instant.now());

        return toResponse(customerSettingsRepository.save(document));
    }

    private CustomerSettingsDocument createDefaultSettings(String userId) {
        CustomerSettingsDocument document = new CustomerSettingsDocument();
        document.setId(java.util.UUID.randomUUID());
        document.setUserId(java.util.UUID.fromString(userId));
        document.setTheme("light");
        document.setFontScale("normal");
        document.setAllowLocation(false);
        document.setAllowCamera(false);
        document.setLocationPermissionShown(false);
        Instant now = Instant.now();
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        return customerSettingsRepository.save(document);
    }

    private CustomerSettingsResponse toResponse(CustomerSettingsDocument document) {
        CustomerSettingsResponse response = new CustomerSettingsResponse();
        response.setTheme(document.getTheme() == null ? "light" : document.getTheme());
        response.setFontScale(document.getFontScale() == null ? "normal" : document.getFontScale());
        response.setAllowLocation(document.isAllowLocation());
        response.setAllowCamera(document.isAllowCamera());
        response.setLocationPermissionShown(document.isLocationPermissionShown());
        return response;
    }

    private String normalizeTheme(String value) {
        if (value == null) return "light";
        String normalized = value.trim().toLowerCase();
        return "dark".equals(normalized) ? "dark" : "light";
    }

    private String normalizeFontScale(String value) {
        if (value == null) return "normal";
        String normalized = value.trim().toLowerCase();
        if ("compact".equals(normalized) || "large".equals(normalized)) {
            return normalized;
        }
        return "normal";
    }

}
