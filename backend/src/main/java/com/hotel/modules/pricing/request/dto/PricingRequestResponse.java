package com.hotel.modules.pricing.request.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PricingRequestResponse {

    private String id;
    private String branchId;
    private String branchName;   // Tên chi nhánh — để frontend hiển thị thay vì UUID
    private String name;
    private LocalDate startsOn;
    private LocalDate endsOn;
    private BigDecimal discountPercent;
    /** INCREASE | DECREASE | NO_CHANGE — tiện cho frontend hiển thị */
    private String priceDirection;
    private String reason;
    private String notes;
    private String status;
    private String requestedBy;
    private String reviewedBy;
    private String reviewNote;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getStartsOn() { return startsOn; }
    public void setStartsOn(LocalDate startsOn) { this.startsOn = startsOn; }

    public LocalDate getEndsOn() { return endsOn; }
    public void setEndsOn(LocalDate endsOn) { this.endsOn = endsOn; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) == 0) {
            this.priceDirection = "NO_CHANGE";
        } else if (discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            // discount dương = giảm giá
            this.priceDirection = "DECREASE";
        } else {
            // discount âm = tăng giá (surcharge)
            this.priceDirection = "INCREASE";
        }
    }

    public String getPriceDirection() { return priceDirection; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}
