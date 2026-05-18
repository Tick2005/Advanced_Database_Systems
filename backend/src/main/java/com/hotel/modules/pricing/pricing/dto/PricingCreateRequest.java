package com.hotel.modules.pricing.pricing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PricingCreateRequest {

    /** Danh sách branch áp dụng. Rỗng = tất cả chi nhánh. */
    private List<String> branchIds;

    /** Danh sách loại phòng áp dụng. Rỗng = tất cả loại phòng. */
    private List<String> roomTypeIds;

    @NotBlank
    private String name;

    @NotNull
    private LocalDate startsOn;

    @NotNull
    private LocalDate endsOn;

    @NotNull
    private BigDecimal discountPercent;

    private String notes;

    public List<String> getBranchIds() { return branchIds; }
    public void setBranchIds(List<String> branchIds) { this.branchIds = branchIds; }

    public List<String> getRoomTypeIds() { return roomTypeIds; }
    public void setRoomTypeIds(List<String> roomTypeIds) { this.roomTypeIds = roomTypeIds; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getStartsOn() { return startsOn; }
    public void setStartsOn(LocalDate startsOn) { this.startsOn = startsOn; }

    public LocalDate getEndsOn() { return endsOn; }
    public void setEndsOn(LocalDate endsOn) { this.endsOn = endsOn; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
