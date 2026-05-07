package com.hotel.common.response;

import java.time.Instant;
import java.util.Map;

public class ErrorResponse {

	private String code;
	private String message;
	private Instant timestamp;
	private Map<String, String> fieldErrors;

	public ErrorResponse() {
	}

	public ErrorResponse(String code, String message, Instant timestamp, Map<String, String> fieldErrors) {
		this.code = code;
		this.message = message;
		this.timestamp = timestamp;
		this.fieldErrors = fieldErrors;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public Instant getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(Instant timestamp) {
		this.timestamp = timestamp;
	}

	public Map<String, String> getFieldErrors() {
		return fieldErrors;
	}

	public void setFieldErrors(Map<String, String> fieldErrors) {
		this.fieldErrors = fieldErrors;
	}
}

