package com.hotel.modules.feedback;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import com.hotel.common.enums.BookingStatus;
import com.hotel.exception.BusinessException;
import com.hotel.exception.NotFoundException;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.feedback.dto.FeedbackCreateRequest;
import com.hotel.modules.feedback.dto.FeedbackReplyRequest;
import com.hotel.modules.feedback.dto.FeedbackResponse;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;
    private final MongoTemplate mongoTemplate;

    public FeedbackService(FeedbackRepository feedbackRepository, BookingRepository bookingRepository, MongoTemplate mongoTemplate) {
        this.feedbackRepository = feedbackRepository;
        this.bookingRepository = bookingRepository;
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

    public FeedbackResponse reply(FeedbackReplyRequest request) {
        FeedbackDocument document = feedbackRepository.findById(java.util.Objects.requireNonNull(request.getFeedbackId()))
            .orElseThrow(() -> new NotFoundException("Feedback not found: " + request.getFeedbackId()));
        document.setManagerReply(request.getReply());
        document.setUpdatedAt(Instant.now());
        return toResponse(feedbackRepository.save(document));
    }

    public Map<String, Double> getAverageRatingsByRoom() {
        Map<String, Double> result = new LinkedHashMap<>();
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("room_id").exists(true).ne("")),
            Aggregation.group("room_id").avg("rating").as("avgRating"),
            Aggregation.project("avgRating").and("_id").as("roomId").andExclude("_id")
        );

        for (Document item : mongoTemplate.aggregate(aggregation, "feedbacks", Document.class).getMappedResults()) {
            String roomId = item.getString("roomId");
            if (roomId == null || roomId.isBlank()) {
                continue;
            }
            Object avgRatingValue = item.get("avgRating");
            double avgRating = avgRatingValue instanceof Number number ? number.doubleValue() : 0.0d;
            result.put(roomId, avgRating);
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
}