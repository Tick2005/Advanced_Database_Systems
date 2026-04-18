package com.hotel.modules.payment;

import com.hotel.common.enums.PaymentStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.payment.dto.PaymentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

	private final PaymentRepository paymentRepository;
	private final BookingService bookingService;

	public PaymentService(PaymentRepository paymentRepository, BookingService bookingService) {
		this.paymentRepository = paymentRepository;
		this.bookingService = bookingService;
	}

	@Transactional
	public PaymentResponse createPayment(PaymentCreateRequest request) {
		if ("vnpay".equalsIgnoreCase(request.getProvider())) {
			PaymentEntity pending = createVnPayPendingPayment(request.getBookingId(), request.getAmount(), request.getCurrency());
			return toResponse(pending);
		}

		PaymentEntity entity = new PaymentEntity();
		entity.setId(UUID.randomUUID());
		entity.setBookingId(UUID.fromString(request.getBookingId()));
		entity.setProvider(request.getProvider());
		entity.setAmount(request.getAmount());
		entity.setCurrency(request.getCurrency());
		entity.setStatus(PaymentStatus.SUCCESS);
		entity.setTransactionRef(request.getProvider().toUpperCase() + "-" + UUID.randomUUID());
		entity.setCreatedAt(LocalDateTime.now());
		entity.setUpdatedAt(LocalDateTime.now());
		entity.setPaidAt(LocalDateTime.now());
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
	public PaymentEntity createVnPayPendingPayment(String bookingId, BigDecimal amount, String currency) {
		UUID bookingUuid = UUID.fromString(bookingId);
		paymentRepository.findByBookingId(bookingUuid).ifPresent(existing -> {
			if (existing.getStatus() == PaymentStatus.SUCCESS) {
				throw new IllegalStateException("Booking already paid: " + bookingId);
			}
		});

		PaymentEntity entity = paymentRepository.findByBookingId(bookingUuid).orElseGet(PaymentEntity::new);
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
		entity.setTransactionRef("VNPAY-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8));
		entity.setUpdatedAt(LocalDateTime.now());
		return paymentRepository.save(entity);
	}

	@Transactional
	public PaymentEntity createVnPayPendingPaymentForCustomer(String bookingId, String customerId, BigDecimal amount, String currency) {
		bookingService.ensureCustomerOwnsBooking(bookingId, customerId);
		return createVnPayPendingPayment(bookingId, amount, currency);
	}

	@Transactional
	public PaymentEntity updateByVnPayResult(String transactionRef, boolean success, LocalDateTime paidAt) {
		if (transactionRef == null || transactionRef.isBlank()) {
			throw new BusinessException("transactionRef is required");
		}
		PaymentEntity entity = paymentRepository.findFirstByTransactionRefOrderByCreatedAtDesc(transactionRef)
			.orElseThrow(() -> new NotFoundException("Payment not found by transactionRef: " + transactionRef));

		if (entity.getStatus() == PaymentStatus.SUCCESS) {
			return entity;
		}

		if (success) {
			entity.setStatus(PaymentStatus.SUCCESS);
			entity.setPaidAt(paidAt == null ? LocalDateTime.now() : paidAt);
			bookingService.markPaid(entity.getBookingId().toString());
		} else {
			entity.setStatus(PaymentStatus.FAILED);
		}
		entity.setUpdatedAt(LocalDateTime.now());
		return paymentRepository.save(entity);
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

