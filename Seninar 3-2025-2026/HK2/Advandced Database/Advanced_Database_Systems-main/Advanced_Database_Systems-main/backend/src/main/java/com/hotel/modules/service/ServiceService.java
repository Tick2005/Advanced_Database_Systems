package com.hotel.modules.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.hotel.common.enums.ServiceMode;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.service.dto.ServiceCreateRequest;
import com.hotel.modules.service.dto.ServiceResponse;
import com.hotel.modules.service.dto.ServiceUpdateRequest;

@Service
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final ServiceMapper serviceMapper;

    public ServiceService(ServiceRepository serviceRepository, ServiceMapper serviceMapper) {
        this.serviceRepository = serviceRepository;
        this.serviceMapper = serviceMapper;
    }

    public List<ServiceResponse> getByBranch(String branchId) {
        return serviceRepository.findByBranchId(branchId).stream()
            .map(serviceMapper::toResponse)
            .toList();
    }

    public ServiceResponse getById(String id) {
        ServiceRecord record = serviceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Service not found: " + id));
        return serviceMapper.toResponse(record);
    }

    public ServiceResponse create(ServiceCreateRequest request) {
        validateServiceMode(request.getServiceMode());
        return serviceMapper.toResponse(serviceRepository.create(request));
    }

    public ServiceResponse update(String id, ServiceUpdateRequest request) {
        if (serviceRepository.findById(id).isEmpty()) {
            throw new NotFoundException("Service not found: " + id);
        }
        if (request.getServiceMode() != null) {
            validateServiceMode(request.getServiceMode());
        }
        return serviceMapper.toResponse(serviceRepository.update(id, request));
    }

	private void validateServiceMode(String serviceMode) {
		try {
			ServiceMode.valueOf(serviceMode.trim().toUpperCase());
		} catch (RuntimeException ex) {
			throw new BusinessException("Unsupported service mode: " + serviceMode);
		}
	}
}
