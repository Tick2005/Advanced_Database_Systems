package com.hotel.modules.payment;

import com.hotel.common.enums.PaymentStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.payment.dto.PaymentResponse;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.EntityManager;

@Service
public class PaymentService {

	private final PaymentRepository paymentRepository;
	private final BookingRepository bookingRepository;
	private final BookingService bookingService;
	private final JdbcTemplate jdbcTemplate;
	private final EntityManager entityManager;

	public PaymentService(
		PaymentRepository paymentRepository,
		BookingRepository bookingRepository,
		BookingService bookingService,
		JdbcTemplate jdbcTemplate,
		EntityManager entityManager
	) {
		this.paymentRepository = paymentRepository;
		this.bookingRepository = bookingRepository;
		this.bookingService = bookingService;
		this.jdbcTemplate = jdbcTemplate;
		this.entityManager = entityManager;
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public PaymentResponse createPayment(PaymentCreateRequest request) {
		UUID bookingId = UUID.fromString(request.getBookingId());
		bookingRepository.findByIdForUpdate(bookingId)
			.orElseThrow(() -> new NotFoundException("Booking not found: " + request.getBookingId()));

		if ("vnpay".equalsIgnoreCase(request.getProvider())) {
			return toResponse(createVnPayPendingPayment(request.getBookingId(), request.getAmount(), request.getCurrency()));
		}

		PaymentEntity existing = paymentRepository.findByBookingIdForUpdate(bookingId).orElse(null);
		if (existing != null) {
			if (existing.getStatus() == PaymentStatus.SUCCESS) {
				return toResponse(existing);
			}
			populateSuccessfulPayment(existing, request.getProvider(), request.getAmount(), request.getCurrency());
			paymentRepository.save(existing);
			bookingService.markPaid(request.getBookingId());
			return toResponse(existing);
		}

		PaymentEntity entity = new PaymentEntity();
		entity.setId(UUID.randomUUID());
		entity.setBookingId(bookingId);
		populateSuccessfulPayment(entity, request.getProvider(), request.getAmount(), request.getCurrency());
		entity.setCreatedAt(LocalDateTime.now());
		paymentRepository.save(entity);
		bookingService.markPaid(request.getBookingId());
		return toResponse(entity);
	}

	@Transactional
	public PaymentResponse createPaymentForCustomer(PaymentCreateRequest request, String customerId) {
		bookingService.ensureCustomerOwnsBooking(request.getBookingId(), customerId);
		return createPayment(request);
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public PaymentEntity createVnPayPendingPayment(String bookingId, BigDecimal amount, String currency) {
		UUID bookingUuid = UUID.fromString(bookingId);
		bookingRepository.findByIdForUpdate(bookingUuid)
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		PaymentEntity existing = paymentRepository.findByBookingIdForUpdate(bookingUuid).orElse(null);
		if (existing != null) {
			if (existing.getStatus() == PaymentStatus.SUCCESS) {
				throw new IllegalStateException("Booking already paid: " + bookingId);
			}
			if (existing.getStatus() == PaymentStatus.PENDING) {
				return existing;
			}
		}

		PaymentEntity entity = existing == null ? new PaymentEntity() : existing;
		if (entity.getId() == null) {
			entity.setId(UUID.randomUUID());
			entity.setCreatedAt(LocalDateTime.now());
		}
		entity.setBookingId(bookingUuid);
		entity.setProvider("VNPAY");
		entity.setAmount(amount);
		entity.setCurrency(currency == null || currency.isBlank() ? "VND" : currency);
		entity.setStatus(PaymentStatus.PENDING);
		entity.setPaidAt(null);
		entity.setTransactionRef(generateTransactionRef("VNPAY"));
		entity.setUpdatedAt(LocalDateTime.now());
		return paymentRepository.save(entity);
	}

	@Transactional
	public PaymentEntity createVnPayPendingPaymentForCustomer(String bookingId, String customerId, BigDecimal amount, String currency) {
		bookingService.ensureCustomerOwnsBooking(bookingId, customerId);
		return createVnPayPendingPayment(bookingId, amount, currency);
	}

	@Transactional
	@Retryable(
		retryFor = {
			CannotAcquireLockException.class,
			PessimisticLockingFailureException.class,
			ConcurrencyFailureException.class,
			TransientDataAccessException.class
		},
		maxAttempts = 3,
		backoff = @Backoff(delay = 120, multiplier = 2.0)
	)
	public PaymentEntity updateByVnPayResult(String transactionRef, boolean success, LocalDateTime paidAt) {
		if (transactionRef == null || transactionRef.isBlank()) {
			throw new BusinessException("transactionRef is required");
		}
		PaymentEntity entity = paymentRepository.findByTransactionRefForUpdate(transactionRef)
			.orElseThrow(() -> new NotFoundException("Payment not found by transactionRef: " + transactionRef));

		if (entity.getStatus() == PaymentStatus.SUCCESS) {
			return entity;
		}

		if (success) {
			confirmBookingPayment(entity.getBookingId(), transactionRef, entity.getProvider(), entity.getCurrency());
		} else {
			entity.setStatus(PaymentStatus.FAILED);
			entity.setPaidAt(null);
			entity.setTransactionRef(transactionRef);
			entity.setProvider(entity.getProvider() == null || entity.getProvider().isBlank() ? "VNPAY" : entity.getProvider());
			entity.setCurrency(entity.getCurrency() == null || entity.getCurrency().isBlank() ? "VND" : entity.getCurrency());
			if (entity.getAmount() == null) {
				entity.setAmount(BigDecimal.ZERO);
			}
		}
		PaymentEntity saved;
		if (success) {
			entityManager.clear();
			saved = paymentRepository.findByBookingId(entity.getBookingId())
				.orElseThrow(() -> new NotFoundException("Payment not found for booking: " + entity.getBookingId()));
		} else {
			entity.setUpdatedAt(LocalDateTime.now());
			saved = paymentRepository.save(entity);
		}
		return saved;
	}

	private void confirmBookingPayment(UUID bookingId, String transactionRef, String provider, String currency) {
		String resolvedProvider = provider == null || provider.isBlank() ? "VNPAY" : provider;
		String resolvedCurrency = currency == null || currency.isBlank() ? "VND" : currency;
		jdbcTemplate.query(
			"SELECT fn_confirm_room_booking(?::uuid, ?, ?, ?, ?::jsonb)",
			rs -> null,
			bookingId,
			transactionRef,
			resolvedProvider,
			resolvedCurrency,
			"{}"
		);
	}

	private void populateSuccessfulPayment(PaymentEntity entity, String provider, BigDecimal amount, String currency) {
		entity.setProvider(provider);
		entity.setAmount(amount);
		entity.setCurrency(currency == null || currency.isBlank() ? "VND" : currency);
		entity.setStatus(PaymentStatus.SUCCESS);
		entity.setTransactionRef(generateTransactionRef(provider));
		entity.setUpdatedAt(LocalDateTime.now());
		entity.setPaidAt(LocalDateTime.now());
	}

	private String generateTransactionRef(String provider) {
		String prefix = provider == null || provider.isBlank() ? "PAYMENT" : provider.toUpperCase();
		return prefix + "-" + UUID.randomUUID();
	}

	private PaymentResponse toResponse(PaymentEntity entity) {
		PaymentResponse response = new PaymentResponse();
		response.setId(entity.getId().toString());
		response.setBookingId(entity.getBookingId().toString());
		response.setStatus(entity.getStatus().name());
		response.setTransactionRef(entity.getTransactionRef());
		response.setAmount(entity.getAmount());
		response.setCurrency(entity.getCurrency());
		response.setPaidAt(entity.getPaidAt());
		return response;
	}
}