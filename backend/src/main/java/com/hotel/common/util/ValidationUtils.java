package com.hotel.common.util;

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
}