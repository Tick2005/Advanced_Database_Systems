package com.hotel.common.mapper;

import java.util.UUID;

public final class CommonMapper {

    private CommonMapper() {
    }

    public static UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return UUID.fromString(value);
    }
}
