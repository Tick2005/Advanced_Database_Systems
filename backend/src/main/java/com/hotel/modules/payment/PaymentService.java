package com.hotel.modules.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.enums.PaymentStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.payment.dto.PaymentResponse;

import jakarta.persistence.EntityManager;

@Service
public class PaymentService {

	private final PaymentRepository paymentRepository;
	private final BookingRepository bookingRepository;
	private final BookingService bookingService;
	private final JdbcTemplate jdbcTemplate;
	private final EntityManager entityManager;
	private final int bookingHoldMinutes;

	public PaymentService(
		PaymentRepository paymentRepository,
		BookingRepository bookingRepository,
		BookingService bookingService,
		JdbcTemplate jdbcTemplate,
		EntityManager entityManager,
		@Value("${app.booking.hold-minutes:15}") int bookingHoldMinutes
	) {
		this.paymentRepository = paymentRepository;
		this.bookingRepository = bookingRepository;
		this.bookingService = bookingService;
		this.jdbcTemplate = jdbcTemplate;
		this.entityManager = entityManager;
		this.bookingHoldMinutes = Math.max(5, bookingHoldMinutes);
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
		// Delegate to the retryable method — called from outside its own transaction
		// so @Retryable can start a fresh transaction on each attempt.
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
		if (currency != null && !currency.trim().equalsIgnoreCase("VND")) {
			throw new BusinessException("Chỉ hỗ trợ thanh toán bằng tiền tệ VNĐ (VND)");
		}

		UUID bookingUuid = UUID.fromString(bookingId);
		var booking = bookingRepository.findByIdForUpdate(bookingUuid)
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		// Chuyển booking sang PENDING_PAYMENT để tránh bị scheduler expire trong khi đang thanh toán
		// Chỉ chuyển nếu đang ở HOLD (lần đầu) hoặc PENDING_PAYMENT (retry)
		if (booking.getStatus() == com.hotel.common.enums.BookingStatus.HOLD) {
			booking.setStatus(com.hotel.common.enums.BookingStatus.PENDING_PAYMENT);
		} else if (booking.getStatus() != com.hotel.common.enums.BookingStatus.PENDING_PAYMENT) {
			throw new BusinessException("Booking is not in a payable state: " + booking.getStatus());
		}
		booking.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(booking);

		// Validate that the payment amount is at least the base booking total price (VAT & services added on frontend)
		if (amount == null || amount.compareTo(booking.getTotalPrice()) < 0) {
			throw new BusinessException(
				"Số tiền thanh toán (" + amount + ") nhỏ hơn giá trị đơn đặt phòng (" + booking.getTotalPrice() + ")." +
				" Vui lòng kiểm tra lại nếu có sự thay đổi giá."
			);
		}

		PaymentEntity existing = paymentRepository.findByBookingIdForUpdate(bookingUuid).orElse(null);
		if (existing != null) {
			if (existing.getStatus() == PaymentStatus.SUCCESS) {
				throw new IllegalStateException("Booking already paid: " + bookingId);
			}
			if (existing.getStatus() == PaymentStatus.PENDING) {
				// Sinh transactionRef mới vì transactionRef cũ đã hết hạn trên VNPay (30 phút).
				// Không reuse transactionRef cũ — VNPay sẽ từ chối giao dịch đã expire.
				existing.setTransactionRef(generateTransactionRef("VNPAY"));
				existing.setAmount(amount);
				existing.setCurrency(currency == null || currency.isBlank() ? "VND" : currency);
				existing.setUpdatedAt(LocalDateTime.now());
				return paymentRepository.save(existing);
			}
			// FAILED hoặc trạng thái khác → tạo lại payment mới bên dưới
		}

		// Tạo mới hoặc reuse entity cũ (FAILED) — không thể INSERT mới vì booking_id UNIQUE
		PaymentEntity entity = (existing != null) ? existing : new PaymentEntity();
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
		// Ownership check runs in its own read-only transaction before the retryable write.
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
			entity.setUpdatedAt(LocalDateTime.now());
			paymentRepository.save(entity);
			// Huỷ booking và giải phóng phòng khi thanh toán thất bại
			cancelBookingOnPaymentFailure(entity.getBookingId());
		}
		PaymentEntity saved;
		if (success) {
			// The DB function fn_confirm_room_booking updates the payment row directly via SQL.
			// Flush and clear the first-level cache so the subsequent find() reads the
			// committed state written by the function, not the stale Hibernate snapshot.
			entityManager.flush();
			entityManager.clear();
			saved = paymentRepository.findById(entity.getId())
				.orElseThrow(() -> new NotFoundException("Payment not found after confirmation: " + entity.getId()));
		} else {
			saved = paymentRepository.findById(entity.getId())
				.orElse(entity);
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

	private void cancelBookingOnPaymentFailure(UUID bookingId) {
		try {
			bookingService.cancelBookingOnPaymentFailure(bookingId.toString());
		} catch (Exception ex) {
			// Log nhưng không throw — payment đã được update FAILED, booking sẽ bị expire bởi scheduler
			org.slf4j.LoggerFactory.getLogger(PaymentService.class)
				.warn("[PaymentService] Could not cancel booking {} after payment failure: {}", bookingId, ex.getMessage());
		}
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