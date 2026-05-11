package com.hotel.modules.feedback;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import com.hotel.common.enums.BookingStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.branch.BranchEntity;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.feedback.dto.FeedbackCreateRequest;
import com.hotel.modules.feedback.dto.FeedbackReplyRequest;
import com.hotel.modules.feedback.dto.FeedbackResponse;
import com.hotel.modules.feedback.dto.RoomFeedbackSummaryResponse;
import com.hotel.modules.room.RoomEntity;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.room.RoomTypeEntity;
import com.hotel.modules.room.RoomTypeRepository;
import com.hotel.modules.user.ProfileEntity;
import com.hotel.modules.user.ProfileRepository;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;
    private final ProfileRepository profileRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BranchRepository branchRepository;
    private final MongoTemplate mongoTemplate;

    public FeedbackService(
        FeedbackRepository feedbackRepository,
        BookingRepository bookingRepository,
        ProfileRepository profileRepository,
        RoomRepository roomRepository,
        RoomTypeRepository roomTypeRepository,
        BranchRepository branchRepository,
        MongoTemplate mongoTemplate
    ) {
        this.feedbackRepository = feedbackRepository;
        this.bookingRepository = bookingRepository;
        this.profileRepository = profileRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.branchRepository = branchRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public FeedbackResponse create(FeedbackCreateRequest request) {
        return create(request, request.getUserId());
    }

    public FeedbackResponse create(FeedbackCreateRequest request, String currentUserId) {
        UUID bookingId = UUID.fromString(request.getBookingId());
        var booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
            .orElseThrow(() -> new NotFoundException("Booking not found: " + request.getBookingId()));
        UUID bookingRoomId = booking.getRoomId();

        if (currentUserId == null || !booking.getCustomerId().toString().equals(currentUserId)) {
            throw new BusinessException("Feedback must belong to the current customer booking");
        }
        if (booking.getStatus() != BookingStatus.CHECKED_OUT) {
            throw new BusinessException("You can only review a booking after checkout");
        }
        if (bookingRoomId == null) {
            throw new BusinessException("Booking room is missing");
        }
        String requestRoomId = request.getRoomId();
        if (requestRoomId != null && !requestRoomId.equals(bookingRoomId.toString())) {
            throw new BusinessException("Feedback room does not match the booking room");
        }
        if (feedbackRepository.findByBookingId(request.getBookingId()).isPresent()) {
            throw new BusinessException("This booking has already been reviewed");
        }

        FeedbackDocument document = new FeedbackDocument();
        document.setBookingId(request.getBookingId());
        document.setUserId(currentUserId);
        document.setRoomId(bookingRoomId.toString());
        document.setRating(request.getRating());
        document.setContent(request.getContent());
        document.setCreatedAt(Instant.now());
        document.setUpdatedAt(Instant.now());
        return toResponse(feedbackRepository.save(document));
    }

    public List<FeedbackResponse> getByRoom(String roomId) {
        return feedbackRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream().map(this::toResponse).toList();
    }

    public List<FeedbackResponse> getByUser(String userId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    public List<FeedbackResponse> getTopFeedbacks(int limit) {
        int resolvedLimit = Math.max(1, Math.min(limit, 50));
        List<FeedbackDocument> docs = feedbackRepository.findAllByOrderByRatingDescCreatedAtDesc(PageRequest.of(0, resolvedLimit));
        return enrichResponses(docs);
    }

    public List<RoomFeedbackSummaryResponse> getRoomSummaries(Collection<String> roomIds) {
        if (roomIds == null || roomIds.isEmpty()) {
            return List.of();
        }
        List<String> cleanRoomIds = roomIds.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(id -> !id.isBlank())
            .distinct()
            .toList();

        if (cleanRoomIds.isEmpty()) {
            return List.of();
        }

        // Use MongoTemplate aggregation to avoid repository-projection issues
        org.springframework.data.mongodb.core.aggregation.MatchOperation match =
            org.springframework.data.mongodb.core.aggregation.Aggregation.match(
                org.springframework.data.mongodb.core.query.Criteria.where("room_id").in(cleanRoomIds)
            );

        org.springframework.data.mongodb.core.aggregation.GroupOperation group =
            org.springframework.data.mongodb.core.aggregation.Aggregation.group("room_id")
                .count().as("reviewCount")
                .avg("rating").as("averageRating");

        org.springframework.data.mongodb.core.aggregation.ProjectionOperation project =
            org.springframework.data.mongodb.core.aggregation.Aggregation.project()
                .andExpression("$_id").as("roomId")
                .andInclude("reviewCount", "averageRating");

        org.springframework.data.mongodb.core.aggregation.Aggregation agg =
            org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(match, group, project);

        var results = mongoTemplate.aggregate(agg, "feedbacks", org.bson.Document.class).getMappedResults();

        return results.stream().map(doc -> {
            RoomFeedbackSummaryResponse summary = new RoomFeedbackSummaryResponse();
            summary.setRoomId(doc.getString("roomId"));
            Object rc = doc.get("reviewCount");
            summary.setReviewCount(rc == null ? 0L : ((Number) rc).longValue());
            Object ar = doc.get("averageRating");
            summary.setAverageRating(ar == null ? 0.0d : ((Number) ar).doubleValue());
            return summary;
        }).toList();
    }

    public FeedbackResponse reply(FeedbackReplyRequest request) {
        FeedbackDocument document = feedbackRepository.findById(java.util.Objects.requireNonNull(request.getFeedbackId()))
            .orElseThrow(() -> new NotFoundException("Feedback not found: " + request.getFeedbackId()));
        document.setManagerReply(request.getReply());
        document.setUpdatedAt(Instant.now());
        return toResponse(feedbackRepository.save(document));
    }



    public Map<String, Double> getAverageRatingsByRoom() {
        Map<String, Double> result = new LinkedHashMap<>();

        org.springframework.data.mongodb.core.aggregation.MatchOperation match =
            org.springframework.data.mongodb.core.aggregation.Aggregation.match(
                org.springframework.data.mongodb.core.query.Criteria.where("room_id").exists(true).ne("")
            );

        org.springframework.data.mongodb.core.aggregation.GroupOperation group =
            org.springframework.data.mongodb.core.aggregation.Aggregation.group("room_id")
                .avg("rating").as("avgRating");

        org.springframework.data.mongodb.core.aggregation.ProjectionOperation project =
            org.springframework.data.mongodb.core.aggregation.Aggregation.project()
                .andExpression("$_id").as("roomId")
                .andInclude("avgRating");

        org.springframework.data.mongodb.core.aggregation.Aggregation agg =
            org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(match, group, project);

        var results = mongoTemplate.aggregate(agg, "feedbacks", org.bson.Document.class).getMappedResults();

        for (org.bson.Document doc : results) {
            String roomId = doc.getString("roomId");
            if (roomId == null || roomId.isBlank()) {
                continue;
            }
            Object ar = doc.get("avgRating");
            result.put(roomId, ar == null ? 0.0d : ((Number) ar).doubleValue());
        }

        return result;
    }




    private FeedbackResponse toResponse(FeedbackDocument document) {
        FeedbackResponse response = new FeedbackResponse();
        response.setId(document.getId());
        response.setBookingId(document.getBookingId());
        response.setUserId(document.getUserId());
        response.setRoomId(document.getRoomId());
        response.setRating(Objects.requireNonNullElse(document.getRating(), 0));
        response.setContent(document.getContent());
        response.setManagerReply(document.getManagerReply());
        response.setCreatedAt(document.getCreatedAt());
        return response;
    }

    private List<FeedbackResponse> enrichResponses(List<FeedbackDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return List.of();
        }

        Set<UUID> userIds = documents.stream()
            .map(FeedbackDocument::getUserId)
            .filter(Objects::nonNull)
            .map(this::safeUuid)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Set<UUID> roomIds = documents.stream()
            .map(FeedbackDocument::getRoomId)
            .filter(Objects::nonNull)
            .map(this::safeUuid)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Map<UUID, ProfileEntity> profilesByUserId = profileRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(ProfileEntity::getUserId, profile -> profile));

        Map<UUID, RoomEntity> roomsById = roomRepository.findAllById(roomIds).stream()
            .collect(Collectors.toMap(RoomEntity::getId, room -> room));

        Set<UUID> roomTypeIds = roomsById.values().stream()
            .map(RoomEntity::getRoomTypeId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Map<UUID, RoomTypeEntity> roomTypesById = roomTypeRepository.findAllById(roomTypeIds).stream()
            .collect(Collectors.toMap(RoomTypeEntity::getId, roomType -> roomType));

        Set<UUID> branchIds = roomTypesById.values().stream()
            .map(RoomTypeEntity::getBranchId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Map<UUID, BranchEntity> branchesById = branchRepository.findAllById(branchIds).stream()
            .collect(Collectors.toMap(BranchEntity::getId, branch -> branch));

        return documents.stream().map(document -> {
            FeedbackResponse response = toResponse(document);

            UUID userId = safeUuid(document.getUserId());
            UUID roomId = safeUuid(document.getRoomId());

            ProfileEntity profile = userId == null ? null : profilesByUserId.get(userId);
            if (profile != null) {
                response.setCustomerName(profile.getFullName());
                response.setAvatarUrl(profile.getAvatarUrl());
            }

            RoomEntity room = roomId == null ? null : roomsById.get(roomId);
            if (room != null) {
                response.setRoomName("Room " + room.getRoomNumber());
                RoomTypeEntity roomType = roomTypesById.get(room.getRoomTypeId());
                if (roomType != null) {
                    BranchEntity branch = branchesById.get(roomType.getBranchId());
                    if (branch != null) {
                        response.setBranchName(branch.getName());
                    }
                }
            }

            return response;
        }).toList();
    }

    private UUID safeUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}