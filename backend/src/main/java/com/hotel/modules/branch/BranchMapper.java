package com.hotel.modules.branch;

import com.hotel.modules.branch.dto.BranchCreateRequest;
import com.hotel.modules.branch.dto.BranchResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class BranchMapper {

    public BranchEntity toEntity(BranchCreateRequest request) {
        BranchEntity entity = new BranchEntity();
        entity.setId(UUID.randomUUID());
        entity.setParentBranchId(parseUuid(request.getParentBranchId()));
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setCountry(request.getCountry());
        entity.setCity(request.getCity());
        entity.setAddress(request.getAddress());
        entity.setPhone(request.getPhone());
        entity.setEmail(request.getEmail());
        entity.setTimezone(request.getTimezone());
        entity.setActive(true);
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return entity;
    }

    public BranchResponse toResponse(BranchEntity entity) {
        BranchResponse response = new BranchResponse();
        response.setId(entity.getId() == null ? null : entity.getId().toString());
        response.setParentBranchId(entity.getParentBranchId() == null ? null : entity.getParentBranchId().toString());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCountry(entity.getCountry());
        response.setCity(entity.getCity());
        response.setAddress(entity.getAddress());
        response.setPhone(entity.getPhone());
        response.setEmail(entity.getEmail());
        response.setTimezone(entity.getTimezone());
        response.setLatitude(entity.getLatitude());
        response.setLongitude(entity.getLongitude());
        response.setActive(entity.isActive());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return UUID.fromString(value);
    }
}