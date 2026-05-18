package com.hotel.modules.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class BookingResponse {

	private String id;
	private String customerId;
	private String roomId;
	private String branchId;
	private String roomTypeName;
	private String roomNumber;
	private String branchName;
	private String customerName;
	private String customerEmail;
	private String customerPhone;
	private String status;
	private LocalDate checkInDate;
	private LocalDate checkOutDate;
	private BigDecimal totalPrice;       // Tiền phòng (không gồm services)
	private BigDecimal servicesTotalPrice; // Tổng tiền services đã dùng
	private BigDecimal grandTotalPrice;  // totalPrice + servicesTotalPrice
	private OffsetDateTime holdExpiresAt;
	private int adults;
	private int children;

	// Danh sách services đã dùng
	private List<BookingServiceItemResponse> services;

	// Cảnh báo thay đổi giá — null nếu không có thay đổi
	private BigDecimal effectiveRate;
	private BigDecimal originalRate;
	private String priceAlertMessage;
	private String priceAlertType;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getRoomId() {
		return roomId;
	}

	public void setRoomId(String roomId) {
		this.roomId = roomId;
	}

	public String getBranchId() {
		return branchId;
	}

	public void setBranchId(String branchId) {
		this.branchId = branchId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDate getCheckInDate() {
		return checkInDate;
	}

	public void setCheckInDate(LocalDate checkInDate) {
		this.checkInDate = checkInDate;
	}

	public LocalDate getCheckOutDate() {
		return checkOutDate;
	}

	public void setCheckOutDate(LocalDate checkOutDate) {
		this.checkOutDate = checkOutDate;
	}

	public BigDecimal getTotalPrice() {
		return totalPrice;
	}

	public void setTotalPrice(BigDecimal totalPrice) {
		this.totalPrice = totalPrice;
	}

	public BigDecimal getServicesTotalPrice() { return servicesTotalPrice; }
	public void setServicesTotalPrice(BigDecimal servicesTotalPrice) { this.servicesTotalPrice = servicesTotalPrice; }

	public BigDecimal getGrandTotalPrice() { return grandTotalPrice; }
	public void setGrandTotalPrice(BigDecimal grandTotalPrice) { this.grandTotalPrice = grandTotalPrice; }

	public List<BookingServiceItemResponse> getServices() { return services; }
	public void setServices(List<BookingServiceItemResponse> services) { this.services = services; }

	public OffsetDateTime getHoldExpiresAt() {
		return holdExpiresAt;
	}

	public void setHoldExpiresAt(OffsetDateTime holdExpiresAt) {
		this.holdExpiresAt = holdExpiresAt;
	}
	public String getRoomTypeName() {
		return roomTypeName;
	}
	public void setRoomTypeName(String roomTypeName) {
		this.roomTypeName = roomTypeName;
	}
	public String getRoomNumber() {
		return roomNumber;
	}
	public void setRoomNumber(String roomNumber) {
		this.roomNumber = roomNumber;
	}
	public String getBranchName() {
		return branchName;
	}
	public void setBranchName(String branchName) {
		this.branchName = branchName;
	}
	public String getCustomerName() {
		return customerName;
	}
	public void setCustomerName(String customerName) {
		this.customerName = customerName;
	}
	public String getCustomerEmail() {
		return customerEmail;
	}
	public void setCustomerEmail(String customerEmail) {
		this.customerEmail = customerEmail;
	}
	public String getCustomerPhone() {
		return customerPhone;
	}
	public void setCustomerPhone(String customerPhone) {
		this.customerPhone = customerPhone;
	}
	public int getAdults() {
		return adults;
	}
	public void setAdults(int adults) {
		this.adults = adults;
	}
	public int getChildren() {
		return children;
	}
	public void setChildren(int children) {
		this.children = children;
	}

	public BigDecimal getEffectiveRate() { return effectiveRate; }
	public void setEffectiveRate(BigDecimal effectiveRate) { this.effectiveRate = effectiveRate; }

	public BigDecimal getOriginalRate() { return originalRate; }
	public void setOriginalRate(BigDecimal originalRate) { this.originalRate = originalRate; }

	public String getPriceAlertMessage() { return priceAlertMessage; }
	public void setPriceAlertMessage(String priceAlertMessage) { this.priceAlertMessage = priceAlertMessage; }

	public String getPriceAlertType() { return priceAlertType; }
	public void setPriceAlertType(String priceAlertType) { this.priceAlertType = priceAlertType; }
}

