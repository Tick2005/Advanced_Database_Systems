package com.hotel.modules.pricing.pricing;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.util.ValidationUtils;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.pricing.pricing.dto.PricingCreateRequest;
import com.hotel.modules.pricing.pricing.dto.PricingResponse;
import com.hotel.modules.pricing.pricing.dto.PricingUpdateRequest;

@Service
public class PricingService {

    private final PricingRepository pricingRepository;

    public PricingService(PricingRepository pricingRepository) {
        this.pricingRepository = pricingRepository;
    }

    @Transactional
    public PricingResponse create(PricingCreateRequest request) {
        validateDateRange(request.getStartsOn(), request.getEndsOn());
        validateDiscountPercent(request.getDiscountPercent());
        PricingEntity entity = new PricingEntity();
        entity.setId(UUID.randomUUID());
        entity.setBranchId(ValidationUtils.requireUuid(request.getBranchId(), "branchId"));
        entity.setName(request.getName());
        entity.setStartsOn(request.getStartsOn());
        entity.setEndsOn(request.getEndsOn());
        entity.setDiscountPercent(request.getDiscountPercent());
        entity.setNotes(request.getNotes());
        entity.setActive(true);
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return toResponse(pricingRepository.save(entity));
    }

    @Transactional
    @SuppressWarnings("null")
    public PricingResponse update(String id, PricingUpdateRequest request) {
        PricingEntity entity = pricingRepository.findById(ValidationUtils.requireUuid(id, "id"))
            .orElseThrow(() -> new NotFoundException("Pricing not found: " + id));

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getStartsOn() != null) {
            entity.setStartsOn(request.getStartsOn());
        }
        if (request.getEndsOn() != null) {
            entity.setEndsOn(request.getEndsOn());
        }
        if (request.getDiscountPercent() != null) {
            validateDiscountPercent(request.getDiscountPercent());
            entity.setDiscountPercent(request.getDiscountPercent());
        }
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }
        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }
        entity.setUpdatedAt(LocalDateTime.now());

        return toResponse(pricingRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PricingResponse> getActivePricing() {
        return pricingRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public void refreshSeasonStatus() {
        LocalDate today = LocalDate.now();
        List<PricingEntity> entities = pricingRepository.findAll();

        for (PricingEntity entity : entities) {
            boolean shouldBeActive = !today.isBefore(entity.getStartsOn()) && !today.isAfter(entity.getEndsOn());
            if (entity.isActive() != shouldBeActive) {
                entity.setActive(shouldBeActive);
                entity.setUpdatedAt(LocalDateTime.now());
                pricingRepository.save(entity);
            }
        }
    }

    private PricingResponse toResponse(PricingEntity entity) {
        PricingResponse response = new PricingResponse();
        response.setId(entity.getId().toString());
        response.setBranchId(entity.getBranchId().toString());
        response.setName(entity.getName());
        response.setStartsOn(entity.getStartsOn());
        response.setEndsOn(entity.getEndsOn());
        response.setDiscountPercent(entity.getDiscountPercent());
        response.setNotes(entity.getNotes());
        response.setActive(entity.isActive());
        return response;
    }

    private void validateDateRange(LocalDate startsOn, LocalDate endsOn) {
        if (startsOn == null || endsOn == null) {
            throw new BusinessException("startsOn and endsOn are required");
        }
        if (endsOn.isBefore(startsOn)) {
            throw new BusinessException("endsOn must be on or after startsOn");
        }
    }

    private void validateDiscountPercent(java.math.BigDecimal discountPercent) {
        if (discountPercent == null) {
            throw new BusinessException("discountPercent is required");
        }
        if (discountPercent.compareTo(java.math.BigDecimal.valueOf(-100)) < 0 || discountPercent.compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("discountPercent must be between -100 and 100");
        }
    }
}