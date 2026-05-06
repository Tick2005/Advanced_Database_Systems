package com.hotel.common.util;

import java.util.UUID;

import com.hotel.exception.BusinessException;

public final class ValidationUtils {

    private ValidationUtils() {
    }

    public static String requireNotBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(fieldName + " is required");
        }
        return value;
    }

    public static <T> T requireNotNull(T value, String fieldName) {
        if (value == null) {
            throw new BusinessException(fieldName + " is required");
        }
        return value;
    }

    public static UUID requireUuid(String value, String fieldName) {
        requireNotBlank(value, fieldName);
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(fieldName + " must be a valid UUID");
        }
    }
}