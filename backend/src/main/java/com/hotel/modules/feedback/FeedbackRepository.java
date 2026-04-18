package com.hotel.modules.feedback;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Aggregation;

import java.util.List;

public interface FeedbackRepository extends MongoRepository<FeedbackDocument, String> {

    List<FeedbackDocument> findByRoomIdOrderByCreatedAtDesc(String roomId);

    List<FeedbackDocument> findByUserIdOrderByCreatedAtDesc(String userId);

    @Aggregation(pipeline = {
        "{ '$match': { 'roomId': { '$exists': true, '$ne': '' } } }",
        "{ '$group': { '_id': '$roomId', 'avgRating': { '$avg': '$rating' } } }"
    })
    List<RoomRatingAverageProjection> aggregateAverageRatingsByRoom();

    interface RoomRatingAverageProjection {
        String getId();
        Double getAvgRating();
    }
}