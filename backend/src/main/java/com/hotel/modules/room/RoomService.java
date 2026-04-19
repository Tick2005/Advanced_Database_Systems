package com.hotel.modules.room;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.enums.RoomStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.branch.BranchEntity;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.room.dto.RoomCreateRequest;
import com.hotel.modules.room.dto.RoomResponse;
import com.hotel.modules.room.dto.RoomSearchFilter;
import com.hotel.modules.room.dto.RoomUpdateRequest;

@Service
public class RoomService {

	private final RoomRepository roomRepository;
	private final RoomTypeRepository roomTypeRepository;
	private final BranchRepository branchRepository;
	private final RoomMapper roomMapper;

	public RoomService(
		RoomRepository roomRepository,
		RoomTypeRepository roomTypeRepository,
		BranchRepository branchRepository,
		RoomMapper roomMapper
	) {
		this.roomRepository = roomRepository;
		this.roomTypeRepository = roomTypeRepository;
		this.branchRepository = branchRepository;
		this.roomMapper = roomMapper;
	}

	@Transactional(readOnly = true)
	public List<RoomResponse> getRooms(RoomSearchFilter filter) {
		UUID roomTypeId = filter == null || filter.getRoomTypeId() == null ? null : UUID.fromString(filter.getRoomTypeId());
		RoomStatus status = filter == null || filter.getStatus() == null ? null : parseStatus(filter.getStatus());
		UUID branchId = filter == null || filter.getBranchId() == null ? null : UUID.fromString(filter.getBranchId());
		Double minRating = filter == null ? null : filter.getMinRating();
		var minPrice = filter == null ? null : filter.getMinPrice();
		var maxPrice = filter == null ? null : filter.getMaxPrice();

		List<RoomEntity> rooms = status == null
			? roomRepository.findBySearchCriteriaWithoutStatus(roomTypeId, minPrice, maxPrice, branchId, minRating)
			: roomRepository.findBySearchCriteria(roomTypeId, status, minPrice, maxPrice, branchId, minRating);

		Map<UUID, RoomTypeEntity> roomTypeById = roomTypeRepository.findByIdIn(
			rooms.stream().map(RoomEntity::getRoomTypeId).distinct().toList()
		).stream().collect(java.util.stream.Collectors.toMap(RoomTypeEntity::getId, rt -> rt));

		Map<UUID, BranchEntity> branchById = branchRepository.findAllById(
			roomTypeById.values().stream().map(RoomTypeEntity::getBranchId).distinct().toList()
		).stream().collect(java.util.stream.Collectors.toMap(BranchEntity::getId, b -> b));

		Map<UUID, String> coverImageByRoomId = roomRepository.findCoverImageUrls(
			rooms.stream().map(RoomEntity::getId).distinct().toList()
		).stream().collect(java.util.stream.Collectors.toMap(RoomCoverImageProjection::getRoomId, RoomCoverImageProjection::getImageUrl));

		return rooms.stream()
			.map(room -> {
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
		RoomEntity room = roomRepository.findById(UUID.fromString(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId())
			.orElseThrow(() -> new NotFoundException("Room type not found: " + room.getRoomTypeId()));
		BranchEntity branch = branchRepository.findById(roomType.getBranchId())
			.orElseThrow(() -> new NotFoundException("Branch not found: " + roomType.getBranchId()));
		String imageUrl = roomRepository.findCoverImageUrls(List.of(room.getId())).stream()
			.findFirst()
			.map(RoomCoverImageProjection::getImageUrl)
			.orElse(null);

		room.setBranchId(roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch.getCity(), imageUrl);
	}

	@Transactional
	public RoomResponse createRoom(RoomCreateRequest request) {
		RoomTypeEntity roomType = roomTypeRepository.findById(UUID.fromString(request.getRoomTypeId()))
			.orElseThrow(() -> new NotFoundException("Room type not found: " + request.getRoomTypeId()));

		if (!roomType.getBranchId().toString().equals(request.getBranchId())) {
			throw new BusinessException("roomType does not belong to the requested branch");
		}

		RoomEntity room = new RoomEntity();
		room.setId(UUID.randomUUID());
		room.setRoomTypeId(roomType.getId());
		room.setBranchId(roomType.getBranchId().toString());
		room.setRoomNumber(request.getRoomNumber());
		room.setMaxOccupancy(request.getMaxOccupancy());
		room.setRate(request.getRate());
		room.setStatus(RoomStatus.AVAILABLE);
		LocalDateTime now = LocalDateTime.now();
		room.setCreatedAt(now);
		room.setUpdatedAt(now);

		roomRepository.save(room);
		BranchEntity branch = branchRepository.findById(roomType.getBranchId())
			.orElseThrow(() -> new NotFoundException("Branch not found: " + roomType.getBranchId()));
		return roomMapper.toResponse(room, roomType, branch.getCity(), null);
	}

	@Transactional
	public RoomResponse updateRoom(String id, RoomUpdateRequest request) {
		RoomEntity room = roomRepository.findById(UUID.fromString(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		if (request.getRate() != null) {
			room.setRate(request.getRate());
		}
		if (request.getMaxOccupancy() != null && request.getMaxOccupancy() > 0) {
			room.setMaxOccupancy(request.getMaxOccupancy());
		}
		if (request.getStatus() != null && !request.getStatus().isBlank()) {
			room.setStatus(parseStatus(request.getStatus()));
		}
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);

		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId()).orElse(null);
		BranchEntity branch = roomType == null ? null : branchRepository.findById(roomType.getBranchId()).orElse(null);
		room.setBranchId(roomType == null ? null : roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch == null ? "Unknown" : branch.getCity(), null);
	}

	@Transactional
	public boolean deleteRoom(String id) {
		UUID roomId = UUID.fromString(id);
		if (!roomRepository.existsById(roomId)) {
			return false;
		}
		roomRepository.deleteById(roomId);
		return true;
	}

	@Transactional
	public RoomResponse updateRoomStatus(String id, String status) {
		RoomEntity room = roomRepository.findById(UUID.fromString(id)).orElseThrow(() -> new NotFoundException("Room not found: " + id));
		room.setStatus(parseStatus(status));
		room.setUpdatedAt(LocalDateTime.now());
		roomRepository.save(room);
		RoomTypeEntity roomType = roomTypeRepository.findById(room.getRoomTypeId()).orElse(null);
		BranchEntity branch = roomType == null ? null : branchRepository.findById(roomType.getBranchId()).orElse(null);
		room.setBranchId(roomType == null ? null : roomType.getBranchId().toString());
		return roomMapper.toResponse(room, roomType, branch == null ? "Unknown" : branch.getCity(), null);
	}

	@Transactional
	public void syncAverageRatings(Map<String, Double> averagesByRoom) {
		Map<UUID, List<Double>> ratingByType = new HashMap<>();
		for (Map.Entry<String, Double> entry : averagesByRoom.entrySet()) {
			roomRepository.findById(UUID.fromString(entry.getKey())).ifPresent(room -> {
				ratingByType.computeIfAbsent(room.getRoomTypeId(), k -> new java.util.ArrayList<>()).add(entry.getValue());
			});
		}

		for (Map.Entry<UUID, List<Double>> entry : ratingByType.entrySet()) {
			roomTypeRepository.findById(entry.getKey()).ifPresent(type -> {
				double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
				type.setAverageRating(BigDecimal.valueOf(avg));
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
}

