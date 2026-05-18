package com.hotel.modules.pricing.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PricingRequestCreateRequest {

    @NotBlank
    private String branchId;

    @NotBlank
    private String name;

    @NotNull
    private LocalDate startsOn;

    @NotNull
    private LocalDate endsOn;

    /**
     * Phần trăm điều chỉnh giá tạm thời.
     * > 0: giảm giá (kích cầu khi ít khách)
     * < 0: tăng giá / surcharge (khi đông khách hoặc mặt bằng thị trường cao)
     */
    @NotNull
    private BigDecimal discountPercent;

    /** Lý do đề xuất — bắt buộc để owner có đủ thông tin duyệt */
    @NotBlank
    private String reason;

    private String notes;
    private String requestedBy;

    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getStartsOn() { return startsOn; }
    public void setStartsOn(LocalDate startsOn) { this.startsOn = startsOn; }

    public LocalDate getEndsOn() { return endsOn; }
    public void setEndsOn(LocalDate endsOn) { this.endsOn = endsOn; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
}
