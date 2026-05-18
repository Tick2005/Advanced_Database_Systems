package com.hotel.modules.pricing.pricing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pricing_seasons")
public class PricingEntity {

    @Id
    private UUID id;

    /**
     * Danh sách branch áp dụng.
     * Rỗng ({}) = áp dụng TẤT CẢ chi nhánh.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "branch_ids", columnDefinition = "uuid[]")
    private List<UUID> branchIds = new java.util.ArrayList<>();

    /**
     * Danh sách loại phòng áp dụng.
     * Rỗng ({}) = áp dụng TẤT CẢ loại phòng.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "room_type_ids", columnDefinition = "uuid[]")
    private List<UUID> roomTypeIds = new java.util.ArrayList<>();

    @Column(name = "name")
    private String name;

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "ends_on")
    private LocalDate endsOn;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(name = "notes")
    private String notes;

    @Column(name = "is_active")
    private boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public List<UUID> getBranchIds() { return branchIds; }
    public void setBranchIds(List<UUID> branchIds) {
        this.branchIds = branchIds != null ? branchIds : new java.util.ArrayList<>();
    }

    public List<UUID> getRoomTypeIds() { return roomTypeIds; }
    public void setRoomTypeIds(List<UUID> roomTypeIds) {
        this.roomTypeIds = roomTypeIds != null ? roomTypeIds : new java.util.ArrayList<>();
    }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
