package com.hotel.exception;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.hibernate.StaleObjectStateException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.hotel.common.response.ErrorResponse;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
		log.warn("Not found: {}", ex.getMessage());
		return build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), null);
	}

	@ExceptionHandler(UnauthorizedException.class)
	public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
		log.warn("Unauthorized access: {}", ex.getMessage());
		return build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), null);
	}

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
		log.info("Business rule violation: {}", ex.getMessage());
		return build(HttpStatus.BAD_REQUEST, "BUSINESS_ERROR", ex.getMessage(), null);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> fieldErrors = new HashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(err -> fieldErrors.put(err.getField(), err.getDefaultMessage()));
		log.info("Request validation failed: {}", fieldErrors);
		return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", fieldErrors);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
		Map<String, String> fieldErrors = new LinkedHashMap<>();
		ex.getConstraintViolations().forEach(violation -> fieldErrors.put(violation.getPropertyPath().toString(), violation.getMessage()));
		log.info("Constraint validation failed: {}", fieldErrors);

		return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", fieldErrors);
	}

	@ExceptionHandler(StaleObjectStateException.class)
	public ResponseEntity<ErrorResponse> handleOptimisticLocking(StaleObjectStateException ex) {
		log.warn("Optimistic locking failure - concurrent modification detected: {}", ex.getMessage());
		return build(HttpStatus.CONFLICT, "CONFLICT_ERROR", "The record has been modified by another request. Please refresh and try again.", null);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
		log.info("Invalid request data: {}", ex.getMessage());
		return build(HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT", "Invalid request data", null);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleUnknown(Exception ex) {
		log.error("Unhandled server error", ex);
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected server error", null);
	}

	private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message, Map<String, String> fieldErrors) {
		ErrorResponse body = new ErrorResponse(code, message, Instant.now(), fieldErrors);
		return ResponseEntity.status(status.value()).body(body);
	}
}

