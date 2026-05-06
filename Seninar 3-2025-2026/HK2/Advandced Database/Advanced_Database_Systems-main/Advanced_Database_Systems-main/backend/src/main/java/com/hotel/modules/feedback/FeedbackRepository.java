package com.hotel.modules.feedback;

import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FeedbackRepository extends MongoRepository<FeedbackDocument, String> {

    java.util.Optional<FeedbackDocument> findByBookingId(String bookingId);

    List<FeedbackDocument> findByRoomIdOrderByCreatedAtDesc(String roomId);

    List<FeedbackDocument> findByUserIdOrderByCreatedAtDesc(String userId);

    @Aggregation(pipeline = {
        "{ '$match': { 'room_id': { '$exists': true, '$ne': '' } } }",
        "{ '$group': { '_id': '$room_id', 'avgRating': { '$avg': '$rating' } } }",
        "{ '$project': { 'roomId': '$_id', 'avgRating': 1, '_id': 0 } }"
    })
    List<RoomRatingAverageProjection> aggregateAverageRatingsByRoom();

    interface RoomRatingAverageProjection {
        String getRoomId();
        Double getAvgRating();
    }

}