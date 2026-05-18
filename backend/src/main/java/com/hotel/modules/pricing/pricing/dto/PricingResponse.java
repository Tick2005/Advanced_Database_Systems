package com.hotel.modules.pricing.pricing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PricingResponse {

    private String id;
    /** Danh sách branch áp dụng. Rỗng = tất cả chi nhánh. */
    private List<String> branchIds;
    /** Danh sách loại phòng áp dụng. Rỗng = tất cả loại phòng. */
    private List<String> roomTypeIds;
    private String name;
    private LocalDate startsOn;
    private LocalDate endsOn;
    private BigDecimal discountPercent;
    private String notes;
    private boolean active;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
