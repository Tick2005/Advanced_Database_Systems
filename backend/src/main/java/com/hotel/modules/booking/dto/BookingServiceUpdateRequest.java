package com.hotel.modules.booking.dto;

import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public class BookingServiceUpdateRequest {

    // Frontend gửi serviceId (UUID) — ưu tiên dùng serviceId nếu có.
    // serviceCode vẫn giữ để backward-compat với các client cũ.
    private String serviceId;

    private String serviceCode;

    @Min(1)
    private int quantity = 1;

    private BigDecimal actualPrice;

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceCode() {
        return serviceCode;
    }

    public void setServiceCode(String serviceCode) {
        this.serviceCode = serviceCode;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getActualPrice() {
        return actualPrice;
    }

    public void setActualPrice(BigDecimal actualPrice) {
        this.actualPrice = actualPrice;
    }
}
