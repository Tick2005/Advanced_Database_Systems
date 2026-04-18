package com.hotel.modules.booking;

import com.hotel.common.enums.BookingStatus;
import com.hotel.common.enums.RoomStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.dto.BookingActionResponse;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.booking.dto.BookingFilterRequest;
import com.hotel.modules.booking.dto.BookingResponse;
import com.hotel.modules.booking.dto.BookingServiceResponse;
import com.hotel.modules.booking.dto.BookingServiceUpdateRequest;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.room.RoomService;
import com.hotel.modules.service.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

	private final BookingRepository bookingRepository;
	private final BookingMapper bookingMapper;
	private final BookingValidator bookingValidator;
	private final RoomRepository roomRepository;
	private final BookingServiceRepository bookingServiceRepository;
	private final ServiceRepository serviceRepository;
	private final RoomService roomService;

	public BookingService(
		BookingRepository bookingRepository,
		BookingMapper bookingMapper,
		BookingValidator bookingValidator,
		RoomRepository roomRepository,
		BookingServiceRepository bookingServiceRepository,
		ServiceRepository serviceRepository,
		RoomService roomService
	) {
		this.bookingRepository = bookingRepository;
		this.bookingMapper = bookingMapper;
		this.bookingValidator = bookingValidator;
		this.roomRepository = roomRepository;
		this.bookingServiceRepository = bookingServiceRepository;
		this.serviceRepository = serviceRepository;
		this.roomService = roomService;
	}

	@Transactional
	public BookingResponse createBooking(BookingCreateRequest request) {
		bookingValidator.validateCreateRequest(request);

		var room = roomRepository.findByIdForUpdate(UUID.fromString(request.getRoomId()))
			.orElseThrow(() -> new NotFoundException("Room not found: " + request.getRoomId()));

		if (room.getStatus() != RoomStatus.AVAILABLE) {
			throw new BusinessException("Room is not available for new booking");
		}

		boolean hasOverlap = bookingRepository.existsActiveOverlap(
			room.getId(),
			request.getCheckInDate(),
			request.getCheckOutDate(),
			List.of(BookingStatus.CANCELLED, BookingStatus.EXPIRED, BookingStatus.CHECKED_OUT)
		);
		if (hasOverlap) {
			throw new BusinessException("Room already has an overlapping booking in the selected date range");
		}

		BookingEntity entity = bookingMapper.fromCreateRequest(request);
		entity.setStatus(BookingStatus.HOLD);
		bookingRepository.save(entity);

		room.setStatus(RoomStatus.HELD);
		roomRepository.save(room);

		return bookingMapper.toResponse(entity);
	}

	@Transactional(readOnly = true)
	public List<BookingResponse> getMyBookings(String customerId) {
		return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(UUID.fromString(customerId)).stream()
			.map(bookingMapper::toResponse)
			.toList();
	}

	@Transactional(readOnly = true)
	public BookingResponse getBooking(String id) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(id))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + id));
		return bookingMapper.toResponse(entity);
	}

	@Transactional(readOnly = true)
	public BookingResponse getBookingForCustomer(String bookingId, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);
		return bookingMapper.toResponse(entity);
	}

	@Transactional
	public BookingResponse cancelBooking(String id, String reason) {
		BookingEntity entity = findByIdOrThrow(id);

		bookingValidator.ensureCancellable(entity);
		entity.setStatus(BookingStatus.CANCELLED);
		entity.setCancelReason(reason);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		roomService.updateRoomStatus(entity.getRoomId().toString(), RoomStatus.AVAILABLE.name());
		return bookingMapper.toResponse(entity);
	}

	@Transactional
	public BookingResponse cancelBookingForCustomer(String bookingId, String reason, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);

		bookingValidator.ensureCancellable(entity);
		entity.setStatus(BookingStatus.CANCELLED);
		entity.setCancelReason(reason);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		roomService.updateRoomStatus(entity.getRoomId().toString(), RoomStatus.AVAILABLE.name());
		return bookingMapper.toResponse(entity);
	}

	@Transactional(readOnly = true)
	public void ensureCustomerOwnsBooking(String bookingId, String customerId) {
		BookingEntity entity = findByIdOrThrow(bookingId);
		ensureBookingOwnedBy(entity, customerId);
	}

	@Transactional(readOnly = true)
	public List<BookingResponse> findByFilter(BookingFilterRequest filter) {
		return bookingRepository.findAll(
				BookingSpecifications.byFilter(filter),
				Sort.by(Sort.Direction.DESC, "createdAt")
			).stream()
			.map(bookingMapper::toResponse)
			.toList();
	}

	@Transactional
	public void markPaid(String bookingId) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		entity.setStatus(BookingStatus.CONFIRMED);
		entity.setHoldExpiresAt(null);
		entity.setPaymentDueAt(null);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		roomService.updateRoomStatus(entity.getRoomId().toString(), RoomStatus.OCCUPIED.name());
	}

	@Transactional
	public BookingServiceResponse addService(String bookingId, BookingServiceUpdateRequest request) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		var service = serviceRepository.findByCode(request.getServiceCode())
			.orElseThrow(() -> new NotFoundException("Service code not found: " + request.getServiceCode()));

		BookingServiceEntity serviceEntity = new BookingServiceEntity();
		serviceEntity.setId(UUID.randomUUID());
		serviceEntity.setBookingId(entity.getId());
		serviceEntity.setServiceId(service.id());
		serviceEntity.setServiceCode(request.getServiceCode());
		serviceEntity.setQuantity(request.getQuantity());
		serviceEntity.setActualPrice(request.getActualPrice());
		bookingServiceRepository.save(serviceEntity);

		BookingServiceResponse response = new BookingServiceResponse();
		response.setBookingId(entity.getId().toString());
		response.setServiceCode(serviceEntity.getServiceCode());
		response.setQuantity(serviceEntity.getQuantity());
		return response;
	}

	@Transactional
	public BookingActionResponse checkIn(String bookingId) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		if (entity.getStatus() != BookingStatus.CONFIRMED) {
			throw new BusinessException("Only confirmed booking can be checked in");
		}

		entity.setStatus(BookingStatus.CHECKED_IN);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		roomService.updateRoomStatus(entity.getRoomId().toString(), RoomStatus.OCCUPIED.name());
		return buildActionResponse(entity.getId().toString(), "checkin", entity.getStatus().name());
	}

	@Transactional
	public BookingActionResponse checkOut(String bookingId) {
		BookingEntity entity = bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

		if (entity.getStatus() != BookingStatus.CHECKED_IN) {
			throw new BusinessException("Only checked-in booking can be checked out");
		}

		entity.setStatus(BookingStatus.CHECKED_OUT);
		entity.setUpdatedAt(LocalDateTime.now());
		bookingRepository.save(entity);

		roomService.updateRoomStatus(entity.getRoomId().toString(), RoomStatus.AVAILABLE.name());
		return buildActionResponse(entity.getId().toString(), "checkout", entity.getStatus().name());
	}

	@Transactional
	public void expireOverdueHoldBookings() {
		LocalDateTime now = LocalDateTime.now();
		for (BookingEntity booking : bookingRepository.findByStatusAndHoldExpiresAtBefore(BookingStatus.HOLD, now)) {
			booking.setStatus(BookingStatus.EXPIRED);
			booking.setUpdatedAt(now);
			bookingRepository.save(booking);
			roomService.updateRoomStatus(booking.getRoomId().toString(), RoomStatus.AVAILABLE.name());
		}
	}

	private BookingActionResponse buildActionResponse(String bookingId, String action, String status) {
		BookingActionResponse response = new BookingActionResponse();
		response.setBookingId(bookingId);
		response.setAction(action);
		response.setStatus(status);
		return response;
	}

	private BookingEntity findByIdOrThrow(String bookingId) {
		return bookingRepository.findById(UUID.fromString(bookingId))
			.orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
	}

	private void ensureBookingOwnedBy(BookingEntity booking, String customerId) {
		UUID ownerId = UUID.fromString(customerId);
		if (!booking.getCustomerId().equals(ownerId)) {
			throw new BusinessException("Booking does not belong to the current customer");
		}
	}
}
