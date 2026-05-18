package com.hotel.modules.room;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.enums.RoomStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.branch.BranchEntity;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.room.dto.RoomCreateRequest;
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomSearchFilter;
import com.hotel.modules.room.dto.RoomUpdateRequest;
import com.hotel.modules.room.dto.TopRoomResponse;

@SuppressWarnings("null")
@Service
public class RoomService {

	private final RoomRepository roomRepository;
	private final RoomTypeRepository roomTypeRepository;
	private final BranchRepository branchRepository;
	private final FeedbackService feedbackService;
	private final RoomMapper roomMapper;
	private final JdbcTemplate jdbcTemplate;

	public RoomService(
		RoomRepository roomRepository,
		RoomTypeRepository roomTypeRepository,
		BranchRepository branchRepository,
		FeedbackService feedbackService,
		RoomMapper roomMapper,
		JdbcTemplate jdbcTemplate
	) {
		this.roomRepository = roomRepository;
		this.roomTypeRepository = roomTypeRepository;
		this.branchRepository = branchRepository;
		this.feedbackService = feedbackService;
		this.roomMapper = roomMapper;
		this.jdbcTemplate = jdbcTemplate;
	}

	@Transactional(readOnly = true)
	public List<RoomResponse> getRooms(RoomSearchFilter filter) {
		UUID roomTypeId = filter == null || filter.getRoomTypeId() == null ? null : UUID.fromString(filter.getRoomTypeId());
		String roomTypeName = filter == null ? null : filter.getRoomTypeName();
		RoomStatus status = filter == null || filter.getStatus() == null ? null : parseStatus(filter.getStatus());
		UUID branchId = filter == null || filter.getBranchId() == null ? null : UUID.fromString(filter.getBranchId());
		Double minRating = filter == null ? null : filter.getMinRating();
		var minPrice = filter == null ? null : filter.getMinPrice();
		var maxPrice = filter == null ? null : filter.getMaxPrice();

		List<RoomEntity> rooms = status == null
			? roomRepository.findBySearchCriteriaWithoutStatus(roomTypeId, roomTypeName, minPrice, maxPrice, branchId, minRating)
			: roomRepository.findBySearchCriteria(roomTypeId, roomTypeName, status, minPrice, maxPrice, branchId, minRating);

		Map<UUID, RoomTypeEntity> roomTypeById = roomTypeRepository.findByIdIn(
			rooms.stream().map(RoomEntity::getRoomTypeId).distinct().toList()
		).stream().collect(java.util.stream.Collectors.toMap(RoomTypeEntity::getId, rt -> rt));

		List<UUID> branchIds = roomTypeById.values().stream()
			.map(RoomTypeEntity::getBranchId)
			.filter(Objects::nonNull)
			.toList();

		Map<UUID, BranchEntity> branchById = branchRepository.findAllById(
			branchIds
		).stream().collect(java.util.stream.Collectors.toMap(BranchEntity::getId, b -> b));

		Map<UUID, String> coverImageByRoomId = roomRepository.findCoverImageUrls(
			rooms.stream().map(RoomEntity::getId).distinct().toList()
		).stream().collect(java.util.stream.Collectors.toMap(RoomCoverImageProjection::getRoomId, RoomCoverImageProjection::getImageUrl));
		Map<String, Double> averageRatingsByRoom = feedbackService.getAverageRatingsByRoom();

		return rooms.stream()
			.map(room -> {
				enrichAverageRating(room, averageRatingsByRoom);
				RoomTypeEntity roomType = roomTypeById.get(room.getRoomTypeId());
				BranchEntity branch = roomType == null ? null : branchById.get(roomType.getBranchId());
				if (roomType != null) {
					room.setBranchId(roomType.getBranchId().toString());
				}
				String city = branch == null ? "Unknown" : branch.getCity();
				String imageUrl = coverImageByRoomId.get(room.getId());
				return roomMapper.toResponse(room, roomType, city, imageUrl);
			})
			.toList();
	}

	@Transactional(readOnly = true)
	public RoomResponse getRoomDetail(String id) {
		RoomEntity room = roomRepository.findById(parseUuid(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId())
			.orElseThrow(() -> new NotFoundException("Room type not found: " + room.getRoomTypeId()));
		BranchEntity branch = branchRepository.findById(roomType.getBranchId())
			.orElseThrow(() -> new NotFoundException("Branch not found: " + roomType.getBranchId()));
		String imageUrl = roomRepository.findCoverImageUrls(List.of(room.getId())).stream()
			.findFirst()
			.map(RoomCoverImageProjection::getImageUrl)
			.orElse(null);
		Map<String, Double> averageRatingsByRoom = feedbackService.getAverageRatingsByRoom();
		enrichAverageRating(room, averageRatingsByRoom);

		room.setBranchId(roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch.getCity(), imageUrl);
	}

	@Transactional
	public RoomResponse createRoom(RoomCreateRequest request) {
		RoomTypeEntity roomType = roomTypeRepository.findById(parseUuid(request.getRoomTypeId()))
			.orElseThrow(() -> new NotFoundException("Room type not found: " + request.getRoomTypeId()));

		if (!roomType.getBranchId().toString().equals(request.getBranchId())) {
			throw new BusinessException("roomType does not belong to the requested branch");
		}

		int quantity = request.getQuantity() == null || request.getQuantity() < 1 ? 1 : request.getQuantity();
		java.math.BigDecimal rate = request.getRate() == null ? roomType.getBasePrice() : request.getRate();
		int maxOccupancy = request.getMaxOccupancy() == null ? roomType.getCapacity() : request.getMaxOccupancy();
		String statusStr = request.getStatus() == null ? "AVAILABLE" : request.getStatus();
		LocalDateTime now = LocalDateTime.now();

		Integer maxExisting = roomRepository.findMaxNumericRoomNumberByRoomType(roomType.getId());
		int nextStart = (maxExisting == null ? 100 : (maxExisting + 1));

		RoomEntity firstCreated = null;
		for (int i = 0; i < quantity; i++) {
			RoomEntity room = new RoomEntity();
			room.setId(UUID.randomUUID());
			room.setRoomTypeId(roomType.getId());
			room.setBranchId(roomType.getBranchId().toString());
			String roomNumber = request.getRoomNumber();
			if (quantity > 1 || roomNumber == null || roomNumber.isBlank()) {
				roomNumber = String.valueOf(nextStart + i);
			}
			room.setRoomNumber(roomNumber);
			room.setMaxOccupancy(maxOccupancy);
			room.setRate(rate);
			room.setStatus(parseStatus(statusStr));
			room.setCreatedAt(now);
			room.setUpdatedAt(now);
			roomRepository.save(room);

			// persist images if provided
			if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
				int idx = 0;
				for (String url : request.getImageUrls()) {
					if (url == null || url.isBlank()) continue;
					java.util.UUID imgId = java.util.UUID.randomUUID();
					boolean isCover = idx == 0;
					jdbcTemplate.update(
						"INSERT INTO room_images (id, room_id, image_url, alt_text, is_cover, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, now(), now())",
						imgId, room.getId(), url.trim(), null, isCover, idx
					);
					idx++;
				}
			}

			if (firstCreated == null) firstCreated = room;
		}

		BranchEntity branch = branchRepository.findById(roomType.getBranchId())
			.orElseThrow(() -> new NotFoundException("Branch not found: " + roomType.getBranchId()));
		return roomMapper.toResponse(firstCreated, roomType, branch.getCity(), null);
	}

	@Transactional
	public RoomResponse updateRoom(String id, RoomUpdateRequest request) {
		RoomEntity room = roomRepository.findById(parseUuid(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		if (request.getRate() != null) {
			room.setRate(request.getRate());
		}
		if (request.getMaxOccupancy() != null && request.getMaxOccupancy() > 0) {
			room.setMaxOccupancy(request.getMaxOccupancy());
		}
		if (request.getStatus() != null && !request.getStatus().isBlank()) {
			room.setStatus(parseStatus(request.getStatus()));
		}
		if (request.getNotes() != null) {
			room.setNotes(request.getNotes());
		}
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);

		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId()).orElse(null);
		BranchEntity branch = roomType == null ? null : branchRepository.findById(roomType.getBranchId()).orElse(null);
		room.setBranchId(roomType == null ? null : roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch == null ? "Unknown" : branch.getCity(), null);
	}

	/**
	 * Cập nhật thông tin room type.
	 * Khi basePrice thay đổi → cập nhật rooms.rate của tất cả phòng thuộc room type này.
	 * Khi capacity thay đổi → cập nhật rooms.maxOccupancy để dữ liệu phòng khớp với loại phòng.
	 * Phòng đang OCCUPIED vẫn được giữ nguyên rate cho đến khi check-out nếu cần.
	 */
	@Transactional
	public java.util.Map<String, Object> updateRoomType(String id, java.util.Map<String, Object> payload) {
		RoomTypeEntity rt = roomTypeRepository.findById(parseUuid(id))
			.orElseThrow(() -> new NotFoundException("Room type not found: " + id));

		java.math.BigDecimal oldBasePrice = rt.getBasePrice();
		Integer oldCapacity = rt.getCapacity();

		if (payload.containsKey("name") && payload.get("name") != null) {
			rt.setName((String) payload.get("name"));
		}
		if (payload.containsKey("description")) {
			rt.setDescription((String) payload.get("description"));
		}
		if (payload.containsKey("basePrice") && payload.get("basePrice") != null) {
			rt.setBasePrice(new java.math.BigDecimal(payload.get("basePrice").toString()));
		}
		if (payload.containsKey("capacity") && payload.get("capacity") != null) {
			rt.setCapacity(Integer.parseInt(payload.get("capacity").toString()));
		}
		if (payload.containsKey("bedType")) {
			rt.setBedType((String) payload.get("bedType"));
		}
		rt.setUpdatedAt(LocalDateTime.now());
		roomTypeRepository.save(rt);

		// Nếu basePrice thay đổi → cập nhật rooms.rate của tất cả phòng thuộc room type này
		// Nếu capacity thay đổi → cập nhật rooms.maxOccupancy để đồng bộ dữ liệu room_type/room
		if (rt.getBasePrice() != null && !rt.getBasePrice().equals(oldBasePrice)) {
			List<RoomEntity> rooms = roomRepository.findByRoomTypeId(rt.getId());
			for (RoomEntity room : rooms) {
				if (room.getStatus() != RoomStatus.OCCUPIED) {
					room.setRate(rt.getBasePrice());
					room.setUpdatedAt(LocalDateTime.now());
					roomRepository.save(room);
				}
			}
		}
		if (oldCapacity != null && !oldCapacity.equals(rt.getCapacity())) {
			List<RoomEntity> rooms = roomRepository.findByRoomTypeId(rt.getId());
			for (RoomEntity room : rooms) {
				room.setMaxOccupancy(rt.getCapacity());
				room.setUpdatedAt(LocalDateTime.now());
				roomRepository.save(room);
			}
		}

		java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
		result.put("id", rt.getId().toString());
		result.put("branchId", rt.getBranchId() != null ? rt.getBranchId().toString() : null);
		result.put("code", rt.getCode());
		result.put("name", rt.getName());
		result.put("description", rt.getDescription());
		result.put("basePrice", rt.getBasePrice());
		result.put("capacity", rt.getCapacity());
		result.put("bedType", rt.getBedType());
		result.put("active", rt.isActive());
		result.put("averageRating", rt.getAverageRating());
		return result;
	}

	@Transactional
	public boolean deleteRoom(String id) {		UUID roomId = parseUuid(id);
		if (!roomRepository.existsById(roomId)) {
			return false;
		}
		roomRepository.deleteById(roomId);
		return true;
	}

	@Transactional
	public RoomResponse updateRoomStatus(String id, String status) {
		RoomEntity room = roomRepository.findById(parseUuid(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		RoomStatus newStatus = parseStatus(status);

		// DB trigger fn_enforce_room_status_consistency requires:
		//   OCCUPIED  → current_booking_id must NOT be null
		//   AVAILABLE / MAINTENANCE → current_booking_id must be null
		// Staff can only manually set AVAILABLE, HELD, MAINTENANCE.
		// OCCUPIED is managed automatically by the booking flow (check-in/confirm).
		if (newStatus == RoomStatus.OCCUPIED) {
			throw new BusinessException("Không thể đặt trạng thái OCCUPIED thủ công. Trạng thái này được cập nhật tự động khi khách check-in.");
		}

		// When setting AVAILABLE or MAINTENANCE, clear current_booking_id to satisfy the trigger
		if (newStatus == RoomStatus.AVAILABLE || newStatus == RoomStatus.MAINTENANCE) {
			room.setCurrentBookingId(null);
		}

		room.setStatus(newStatus);
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);
		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId()).orElse(null);
		BranchEntity branch = roomType == null ? null : branchRepository.findById(roomType.getBranchId()).orElse(null);
		room.setBranchId(roomType == null ? null : roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch == null ? "Unknown" : branch.getCity(), null);
	}

	@Transactional
	public void syncAverageRatings(Map<String, Double> averagesByRoom) {
		if (averagesByRoom == null || averagesByRoom.isEmpty()) return;
		Map<UUID, List<Double>> ratingByType = new HashMap<>();
		for (Map.Entry<String, Double> entry : averagesByRoom.entrySet()) {
			String key = entry.getKey();
			if (key == null || key.isBlank()) continue;
			UUID roomId;
			try {
				roomId = parseUuid(key);
			} catch (Exception ex) {
				// skip invalid room id values
				continue;
			}
			Double value = entry.getValue() == null ? 0.0d : entry.getValue();
			UUID finalRoomId = roomId;
			Double finalValue = value;
			roomRepository.findById(finalRoomId).ifPresent(room -> {
				room.setAverageRating(finalValue);
				roomRepository.save(room);
				ratingByType.computeIfAbsent(room.getRoomTypeId(), k -> new java.util.ArrayList<>()).add(finalValue);
			});
		}

		for (Map.Entry<UUID, List<Double>> entry : ratingByType.entrySet()) {
			roomTypeRepository.findById(entry.getKey()).ifPresent(type -> {
				double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
				type.setAverageRating(avg);
				roomTypeRepository.save(type);
			});
		}
	}

	private RoomStatus parseStatus(String value) {
		try {
			return RoomStatus.valueOf(value.toUpperCase());
		} catch (IllegalArgumentException ex) {
			throw new BusinessException("Unsupported room status: " + value);
		}
	}

	private @NonNull UUID parseUuid(String value) {
		return UUID.fromString(value);
	}

	@Transactional(readOnly = true)
	public List<TopRoomResponse> getTopRooms(Double latitude, Double longitude, Integer limit) {
		if (limit == null || limit <= 0) {
			limit = 4;
		}

		List<TopRoomProjection> projections = roomRepository.findTopRoomsByLocation(latitude, longitude, limit);
		Map<String, Double> averageRatingsByRoom = feedbackService.getAverageRatingsByRoom();
		List<UUID> roomIds = projections.stream()
			.map(p -> UUID.fromString(p.getRoomId()))
			.toList();

		Map<UUID, String> coverImageByRoomId = roomRepository.findCoverImageUrls(roomIds)
			.stream()
			.collect(java.util.stream.Collectors.toMap(RoomCoverImageProjection::getRoomId, RoomCoverImageProjection::getImageUrl));

		return projections.stream()
			.map(p -> {
				Double averageRating = p.getAverageRating() == null ? 0.0d : p.getAverageRating();
				Double liveAverageRating = averageRatingsByRoom.getOrDefault(p.getRoomId(), averageRating);
				TopRoomResponse response = new TopRoomResponse(
					p.getRoomId(),
					p.getRoomNumber(),
					liveAverageRating,
					p.getRate(),
					p.getStatus(),
					p.getMaxOccupancy() == null ? 0 : p.getMaxOccupancy(),
					p.getRoomTypeId(),
					p.getRoomTypeName(),
					p.getBranchId(),
					p.getBranchName(),
					p.getBranchCity(),
					p.getBranchLatitude(),
					p.getBranchLongitude(),
					p.getScore(),
					p.getDistanceKm()
				);
				response.setImageUrl(coverImageByRoomId.get(UUID.fromString(p.getRoomId())));
				return response;
			})
			.toList();
	}

	private void enrichAverageRating(RoomEntity room, Map<String, Double> averageRatingsByRoom) {
		if (room == null || averageRatingsByRoom == null || averageRatingsByRoom.isEmpty()) {
			return;
		}
		Double liveAverage = averageRatingsByRoom.get(room.getId().toString());
		if (liveAverage != null) {
			room.setAverageRating(liveAverage);
		}
	}
}