package com.hotel.modules.service;

import com.hotel.modules.service.dto.ServiceResponse;
import org.springframework.stereotype.Component;

@Component
public class ServiceMapper {

    public ServiceResponse toResponse(ServiceRecord record) {
        ServiceResponse response = new ServiceResponse();
        response.setId(record.id().toString());
        response.setBranchId(record.branchId().toString());
        response.setCode(record.code());
        response.setName(record.name());
        response.setDescription(record.description());
        response.setThumbnailUrl(record.thumbnailUrl());
        response.setPrice(record.price());
        response.setServiceMode(record.serviceMode());
        response.setActive(record.active());
        return response;
    }
}
