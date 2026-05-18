package com.hotel.modules.booking.dto;

import java.math.BigDecimal;

/**
 * Thông tin 1 dịch vụ đã được gắn vào booking.
 * Trả về trong BookingResponse.services để frontend hiển thị
 * danh sách dịch vụ và tính tổng tiền chính xác.
 */
public class BookingServiceItemResponse {

    private String serviceId;
    private String serviceName;
    private String serviceCode;
    private int quantity;
    private BigDecimal unitPrice;    // actualPrice / quantity
    private BigDecimal actualPrice;  // tổng tiền dịch vụ này = unitPrice × quantity

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getServiceCode() { return serviceCode; }
    public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getActualPrice() { return actualPrice; }
    public void setActualPrice(BigDecimal actualPrice) { this.actualPrice = actualPrice; }
}
