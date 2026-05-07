package com.hotel.modules.booking.dto;

import java.math.BigDecimal;

public class BookingPaymentRequest {

	private String bookingId;
	private String provider;
	private BigDecimal amount;

	public String getBookingId() {
		return bookingId;
	}

	public void setBookingId(String bookingId) {
		this.bookingId = bookingId;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}
}

