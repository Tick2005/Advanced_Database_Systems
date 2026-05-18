package com.hotel.modules.pricing.pricing;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public PricingService(PricingRepository pricingRepository, JdbcTemplate jdbcTemplate) {
        this.pricingRepository = pricingRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public PricingResponse create(PricingCreateRequest request) {
        validateDateRange(request.getStartsOn(), request.getEndsOn());
        validateDiscountPercent(request.getDiscountPercent());

        PricingEntity entity = new PricingEntity();
        entity.setId(UUID.randomUUID());
        entity.setName(request.getName());
        entity.setStartsOn(request.getStartsOn());
        entity.setEndsOn(request.getEndsOn());
        entity.setDiscountPercent(request.getDiscountPercent());
        entity.setNotes(request.getNotes());
        // branch_ids: rỗng = tất cả chi nhánh
        entity.setBranchIds(parseUuidList(request.getBranchIds()));
        // room_type_ids: rỗng = tất cả loại phòng
        entity.setRoomTypeIds(parseUuidList(request.getRoomTypeIds()));
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

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getStartsOn() != null) entity.setStartsOn(request.getStartsOn());
        if (request.getEndsOn() != null) entity.setEndsOn(request.getEndsOn());
        if (request.getDiscountPercent() != null) {
            validateDiscountPercent(request.getDiscountPercent());
            entity.setDiscountPercent(request.getDiscountPercent());
        }
        if (request.getNotes() != null) entity.setNotes(request.getNotes());
        if (request.getActive() != null) entity.setActive(request.getActive());
        if (request.getBranchIds() != null) entity.setBranchIds(parseUuidList(request.getBranchIds()));
        if (request.getRoomTypeIds() != null) entity.setRoomTypeIds(parseUuidList(request.getRoomTypeIds()));
        entity.setUpdatedAt(LocalDateTime.now());

        return toResponse(pricingRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PricingResponse> getActivePricing() {
        return pricingRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PricingResponse> getAllPricing() {
        // Lọc bỏ seasons được auto-create từ pricing_request approval.
        // Những seasons đó thuộc về luồng pricing_requests và được hiển thị
        // ở trang OwnerPricingRequestsPage — không phải trang seasons thủ công.
        return pricingRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(e -> e.getNotes() == null || !e.getNotes().startsWith("Auto-created from pricing_request"))
            .map(this::toResponse)
            .toList();
    }

    /**
     * Lấy TẤT CẢ seasons kể cả auto-created — dùng nội bộ (pricing engine).
     */
    @Transactional(readOnly = true)
    public List<PricingResponse> getAllPricingIncludingAutoCreated() {
        return pricingRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    /**
     * Refresh is_active của tất cả pricing_seasons theo ngày hiện tại.
     * V10: Gọi SP sp_refresh_pricing_season_status() tại DB layer
     * thay vì Java loop — hiệu quả hơn, tránh N+1 queries.
     */
    @Transactional
    public void refreshSeasonStatus() {
        jdbcTemplate.execute("CALL sp_refresh_pricing_season_status()");
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private List<UUID> parseUuidList(List<String> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<UUID> result = new ArrayList<>();
        for (String s : ids) {
            if (s != null && !s.isBlank()) {
                try { result.add(UUID.fromString(s.trim())); } catch (IllegalArgumentException ignored) {}
            }
        }
        return result;
    }

    private PricingResponse toResponse(PricingEntity entity) {
        PricingResponse response = new PricingResponse();
        response.setId(entity.getId().toString());
        response.setBranchIds(
            entity.getBranchIds() == null ? new ArrayList<>()
                : entity.getBranchIds().stream().map(UUID::toString).toList()
        );
        response.setRoomTypeIds(
            entity.getRoomTypeIds() == null ? new ArrayList<>()
                : entity.getRoomTypeIds().stream().map(UUID::toString).toList()
        );
        response.setName(entity.getName());
        response.setStartsOn(entity.getStartsOn());
        response.setEndsOn(entity.getEndsOn());
        response.setDiscountPercent(entity.getDiscountPercent());
        response.setNotes(entity.getNotes());
        response.setActive(entity.isActive());
        return response;
    }

    private void validateDateRange(java.time.LocalDate startsOn, java.time.LocalDate endsOn) {
        if (startsOn == null || endsOn == null) throw new BusinessException("startsOn and endsOn are required");
        if (endsOn.isBefore(startsOn)) throw new BusinessException("endsOn must be on or after startsOn");
    }

    private void validateDiscountPercent(java.math.BigDecimal discountPercent) {
        if (discountPercent == null) throw new BusinessException("discountPercent is required");
        if (discountPercent.compareTo(java.math.BigDecimal.valueOf(-100)) < 0
                || discountPercent.compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("discountPercent must be between -100 and 100");
        }
    }
}
