package com.hotel.modules.feedback;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FeedbackRepository extends MongoRepository<FeedbackDocument, String> {

    java.util.Optional<FeedbackDocument> findByBookingId(String bookingId);

    List<FeedbackDocument> findByRoomIdOrderByCreatedAtDesc(String roomId);

    List<FeedbackDocument> findByRoomIdIn(Collection<String> roomIds);

    List<FeedbackDocument> findByUserIdOrderByCreatedAtDesc(String userId);

    List<FeedbackDocument> findAllByOrderByRatingDescCreatedAtDesc(Pageable pageable);

    // Get room feedback summaries with count and average rating for multiple rooms
    @Aggregation(pipeline = {
        "{ '$match': { 'room_id': { '$in': ?0 } } }",
        "{ '$group': { '_id': '$room_id', 'count': { '$sum': 1 }, 'avgRating': { '$avg': '$rating' } } }",
        "{ '$project': { 'roomId': '$_id', 'reviewCount': '$count', 'averageRating': '$avgRating', '_id': 0 } }"
    })
    List<RoomFeedbackSummaryProjection> aggregateRoomFeedbackSummaries(Collection<String> roomIds);

    record RoomFeedbackSummaryProjection(String roomId, Long reviewCount, Double averageRating) {}

}