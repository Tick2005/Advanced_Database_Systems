package com.hotel.modules.pricing.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.util.ValidationUtils;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.pricing.request.dto.PricingRequestApproveRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestCreateRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestRejectRequest;
import com.hotel.modules.pricing.request.dto.PricingRequestResponse;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class PricingRequestService {

    private final PricingRequestRepository pricingRequestRepository;
    private final BranchRepository branchRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public PricingRequestService(PricingRequestRepository pricingRequestRepository,
                                  BranchRepository branchRepository) {
        this.pricingRequestRepository = pricingRequestRepository;
        this.branchRepository = branchRepository;
    }

    /**
     * Manager tạo yêu cầu điều chỉnh giá tạm thời cho branch.
     * discountPercent > 0: giảm giá (kích cầu khi ít khách)
     * discountPercent < 0: tăng giá / surcharge (đông khách / mặt bằng cao)
     * starts_on / ends_on: khoảng thời gian áp dụng (bắt buộc)
     */
    @Transactional
    public PricingRequestResponse create(PricingRequestCreateRequest request) {
        validateDateRange(request.getStartsOn(), request.getEndsOn());
        validateDiscountPercent(request.getDiscountPercent());

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BusinessException("reason is required — owner cần biết lý do để duyệt");
        }

        PricingRequestEntity entity = new PricingRequestEntity();
        entity.setId(UUID.randomUUID());
        entity.setBranchId(ValidationUtils.requireUuid(request.getBranchId(), "branchId"));
        entity.setName(request.getName());
        entity.setStartsOn(request.getStartsOn());
        entity.setEndsOn(request.getEndsOn());
        entity.setDiscountPercent(request.getDiscountPercent());
        entity.setReason(request.getReason());
        entity.setNotes(request.getNotes());
        entity.setStatus("PENDING");
        if (request.getRequestedBy() != null && !request.getRequestedBy().isBlank()) {
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
    @SuppressWarnings("null")
    public PricingRequestResponse getById(String id) {
        PricingRequestEntity entity = pricingRequestRepository
            .findById(ValidationUtils.requireUuid(id, "id"))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));
        return toResponse(entity);
    }

    /**
     * Owner duyệt request → gọi stored procedure sp_approve_pricing_request.
     *
     * Fix: Không dùng ::uuid cast trong native query string vì PostgreSQL JDBC
     * không cho phép cast :: trong prepared statement parameters.
     * Dùng CAST(? AS uuid) thay thế.
     */
    @Transactional
    @SuppressWarnings("null")
    public PricingRequestResponse approve(String id, PricingRequestApproveRequest request) {
        PricingRequestEntity entity = pricingRequestRepository
            .findById(ValidationUtils.requireUuid(id, "id"))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException("Pricing request already reviewed: " + entity.getStatus());
        }

        String reviewerId = (request != null && request.getReviewerId() != null && !request.getReviewerId().isBlank())
            ? request.getReviewerId() : null;
        String reviewNote = (request != null) ? request.getReviewNote() : null;

        // Dùng CAST(? AS uuid) thay vì :param::uuid — JDBC không hỗ trợ :: cast trong prepared statement
        entityManager.createNativeQuery(
            "CALL sp_approve_pricing_request(CAST(? AS uuid), CAST(? AS uuid), ?)"
        )
        .setParameter(1, entity.getId().toString())
        .setParameter(2, reviewerId)          // NULL-safe: PostgreSQL nhận NULL trực tiếp
        .setParameter(3, reviewNote)
        .executeUpdate();

        entityManager.refresh(entity);
        return toResponse(entity);
    }

    /**
     * Owner từ chối request → không tạo season, không thay đổi giá.
     */
    @Transactional
    @SuppressWarnings("null")
    public PricingRequestResponse reject(String id, PricingRequestRejectRequest request) {
        PricingRequestEntity entity = pricingRequestRepository
            .findById(ValidationUtils.requireUuid(id, "id"))
            .orElseThrow(() -> new NotFoundException("Pricing request not found: " + id));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException("Pricing request already reviewed: " + entity.getStatus());
        }

        entity.setStatus("REJECTED");
        if (request != null && request.getReviewerId() != null && !request.getReviewerId().isBlank()) {
            entity.setReviewedBy(ValidationUtils.requireUuid(request.getReviewerId(), "reviewerId"));
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
        // Lookup branchName để frontend hiển thị tên chi nhánh thay vì UUID
        branchRepository.findById(entity.getBranchId()).ifPresent(b -> response.setBranchName(b.getName()));
        response.setName(entity.getName());
        response.setStartsOn(entity.getStartsOn());
        response.setEndsOn(entity.getEndsOn());
        response.setDiscountPercent(entity.getDiscountPercent());
        response.setReason(entity.getReason());
        response.setNotes(entity.getNotes());
        response.setStatus(entity.getStatus());
        response.setRequestedBy(entity.getRequestedBy() == null ? null : entity.getRequestedBy().toString());
        response.setReviewedBy(entity.getReviewedBy() == null ? null : entity.getReviewedBy().toString());
        response.setReviewNote(entity.getReviewNote());
        return response;
    }

    private void validateDateRange(java.time.LocalDate startsOn, java.time.LocalDate endsOn) {
        if (startsOn == null || endsOn == null) {
            throw new BusinessException("startsOn and endsOn are required");
        }
        if (endsOn.isBefore(startsOn)) {
            throw new BusinessException("endsOn must be on or after startsOn");
        }
    }

    private void validateDiscountPercent(BigDecimal discountPercent) {
        if (discountPercent == null) {
            throw new BusinessException("discountPercent is required");
        }
        if (discountPercent.compareTo(BigDecimal.valueOf(-100)) < 0
                || discountPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("discountPercent must be between -100 and 100");
        }
    }
}
