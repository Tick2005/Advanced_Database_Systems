package com.hotel.modules.pricing.pricing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PricingUpdateRequest {

    private String name;
    private LocalDate startsOn;
    private LocalDate endsOn;
    private BigDecimal discountPercent;
    private String notes;
    private Boolean active;
    /** Cập nhật danh sách branch áp dụng. null = không thay đổi. */
    private List<String> branchIds;
    /** Cập nhật danh sách loại phòng áp dụng. null = không thay đổi. */
    private List<String> roomTypeIds;

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

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public List<String> getBranchIds() { return branchIds; }
    public void setBranchIds(List<String> branchIds) { this.branchIds = branchIds; }

    public List<String> getRoomTypeIds() { return roomTypeIds; }
    public void setRoomTypeIds(List<String> roomTypeIds) { this.roomTypeIds = roomTypeIds; }
}
