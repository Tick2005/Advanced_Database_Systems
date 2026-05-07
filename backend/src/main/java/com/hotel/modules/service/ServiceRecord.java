package com.hotel.modules.service;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceRecord(
    UUID id,
    UUID branchId,
    String code,
    String name,
    String description,
    String thumbnailUrl,
    BigDecimal price,
    String serviceMode,
    boolean active
) {
}
