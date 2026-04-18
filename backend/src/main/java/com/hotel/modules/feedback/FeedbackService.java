package com.hotel.modules.feedback;

import com.hotel.exception.NotFoundException;
import com.hotel.modules.feedback.dto.FeedbackCreateRequest;
import com.hotel.modules.feedback.dto.FeedbackReplyRequest;
import com.hotel.modules.feedback.dto.FeedbackResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Objects;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public FeedbackResponse create(FeedbackCreateRequest request) {
        FeedbackDocument document = new FeedbackDocument();
        document.setBookingId(request.getBookingId());
        document.setUserId(request.getUserId());
        document.setRoomId(request.getRoomId());
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
        FeedbackDocument document = feedbackRepository.findById(request.getFeedbackId())
            .orElseThrow(() -> new NotFoundException("Feedback not found: " + request.getFeedbackId()));
        document.setManagerReply(request.getReply());
        document.setUpdatedAt(Instant.now());
        return toResponse(feedbackRepository.save(document));
    }

    public Map<String, Double> getAverageRatingsByRoom() {
        Map<String, Double> result = new LinkedHashMap<>();
        for (FeedbackRepository.RoomRatingAverageProjection item : feedbackRepository.aggregateAverageRatingsByRoom()) {
            result.put(item.getId(), item.getAvgRating() == null ? 0.0 : item.getAvgRating());
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