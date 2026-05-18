package com.hotel.modules.room;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_types")
public class RoomTypeEntity {

	@Id
	private UUID id;

	@Column(name = "branch_id", updatable = false)
	private UUID branchId;

	@Column(name = "code", updatable = false)
	private String code;

	@Column(name = "name")
	private String name;

	// slug: NOT NULL UNIQUE — generated on create, never updated
	@Column(name = "slug", updatable = false)
	private String slug;

	@Column(name = "description")
	private String description;

	@Column(name = "base_price")
	private BigDecimal basePrice;

	@Column(name = "capacity")
	private int capacity;

	@Column(name = "bed_type")
	private String bedType;

	@Column(name = "is_active")
	private boolean active;

	@Column(name = "average_rating")
	private Double averageRating;

	@Column(name = "review_count")
	private Integer reviewCount;

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	public UUID getId() { return id; }
	public void setId(UUID id) { this.id = id; }

	public UUID getBranchId() { return branchId; }
	public void setBranchId(UUID branchId) { this.branchId = branchId; }

	public String getCode() { return code; }
	public void setCode(String code) { this.code = code; }

	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public String getSlug() { return slug; }
	public void setSlug(String slug) { this.slug = slug; }

	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }

	public BigDecimal getBasePrice() { return basePrice; }
	public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

	public int getCapacity() { return capacity; }
	public void setCapacity(int capacity) { this.capacity = capacity; }

	public String getBedType() { return bedType; }
	public void setBedType(String bedType) { this.bedType = bedType; }

	public boolean isActive() { return active; }
	public void setActive(boolean active) { this.active = active; }

	public Double getAverageRating() { return averageRating; }
	public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

	public Integer getReviewCount() { return reviewCount; }
	public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

	public LocalDateTime getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

