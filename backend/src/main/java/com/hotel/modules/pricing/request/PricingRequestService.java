package com.hotel.modules.pricing.request;

import com.hotel.exception.NotFoundException;
import com.hotel.exception.BusinessException;
import com.hotel.modules.pricing.pricing.PricingEntity;
import com.hotel.modules.pricing.pricing.PricingRepository;
import com.hotel.modules.pricing.request.dto.PricingRequestApproveRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestCreateRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestRejectRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PricingRequestService {

    private final PricingRequestRepository pricingRequestRepository;
    private final PricingRepository pricingRepository;

    public PricingRequestService(PricingRequestRepository pricingRequestRepository, PricingRepository pricingRepository) {
        this.pricingRequestRepository = pricingRequestRepository;
        this.pricingRepository = pricingRepository;
    }

    @Transactional
    public PricingRequestResponse create(PricingRequestCreateRequest request) {
        PricingRequestEntity entity = new PricingRequestEntity();
        entity.setId(UUID.randomUUID());
        entity.setBranchId(UUID.fromString(request.getBranchId()));
        entity.setName(request.getName());
        entity.setStartsOn(request.getStartsOn());
        entity.setEndsOn(request.getEndsOn());
        entity.setDiscountPercent(request.getDiscountPercent());
        entity.setNotes(request.getNotes());
        entity.setStatus("PENDING");
        if (request.getRequestedBy() != null) {
            entity.setRequestedBy(UUID.fromString(request.getRequestedBy()));
        }
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return toResponse(pricingRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PricingRequestResponse> getAll() {
        return pricingRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PricingRequestResponse getById(String id) {
        PricingRequestEntity entity = pricingRequestRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));
        return toResponse(entity);
    }

    @Transactional
    public PricingRequestResponse approve(String id, PricingRequestApproveRequest request) {
        PricingRequestEntity entity = pricingRequestRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException("Pricing request already reviewed: " + entity.getStatus());
        }

        boolean overlapped = pricingRepository.existsByBranchIdAndActiveTrueAndStartsOnLessThanEqualAndEndsOnGreaterThanEqual(
            entity.getBranchId(),
            entity.getEndsOn(),
            entity.getStartsOn()
        );
        if (overlapped) {
            throw new BusinessException("Active pricing season overlaps requested date range");
        }

        entity.setStatus("APPROVED");
        if (request != null && request.getReviewerId() != null && !request.getReviewerId().isBlank()) {
            entity.setReviewedBy(UUID.fromString(request.getReviewerId()));
        }
        if (request != null) {
            entity.setReviewNote(request.getReviewNote());
        }
        entity.setUpdatedAt(LocalDateTime.now());

        PricingEntity pricing = new PricingEntity();
        pricing.setId(UUID.randomUUID());
        pricing.setBranchId(entity.getBranchId());
        pricing.setName(entity.getName());
        pricing.setStartsOn(entity.getStartsOn());
        pricing.setEndsOn(entity.getEndsOn());
        pricing.setDiscountPercent(entity.getDiscountPercent());
        pricing.setNotes(entity.getNotes());
        pricing.setActive(true);
        LocalDateTime now = LocalDateTime.now();
        pricing.setCreatedAt(now);
        pricing.setUpdatedAt(now);
        pricingRepository.save(pricing);

        return toResponse(pricingRequestRepository.save(entity));
    }

    @Transactional
    public PricingRequestResponse reject(String id, PricingRequestRejectRequest request) {
        PricingRequestEntity entity = pricingRequestRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException("Pricing request already reviewed: " + entity.getStatus());
        }

        entity.setStatus("REJECTED");
        if (request != null && request.getReviewerId() != null && !request.getReviewerId().isBlank()) {
            entity.setReviewedBy(UUID.fromString(request.getReviewerId()));
        }
        if (request != null) {
            entity.setReviewNote(request.getReviewNote());
        }
        entity.setUpdatedAt(LocalDateTime.now());
        return toResponse(pricingRequestRepository.save(entity));
    }

    private PricingRequestResponse toResponse(PricingRequestEntity entity) {
        PricingRequestResponse response = new PricingRequestResponse();
        response.setId(entity.getId().toString());
        response.setBranchId(entity.getBranchId().toString());
        response.setName(entity.getName());
        response.setStartsOn(entity.getStartsOn());
        response.setEndsOn(entity.getEndsOn());
        response.setDiscountPercent(entity.getDiscountPercent());
        response.setNotes(entity.getNotes());
        response.setStatus(entity.getStatus());
        response.setRequestedBy(entity.getRequestedBy() == null ? null : entity.getRequestedBy().toString());
        response.setReviewedBy(entity.getReviewedBy() == null ? null : entity.getReviewedBy().toString());
        response.setReviewNote(entity.getReviewNote());
        return response;
    }
}