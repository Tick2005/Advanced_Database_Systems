package com.hotel.scheduler;

import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.room.RoomService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RatingSyncScheduler {

    private final FeedbackService feedbackService;
    private final RoomService roomService;

    public RatingSyncScheduler(FeedbackService feedbackService, RoomService roomService) {
        this.feedbackService = feedbackService;
        this.roomService = roomService;
    }

    @Scheduled(fixedDelayString = "${app.scheduler.rating-sync-ms:300000}")
    public void syncRoomRatings() {
        roomService.syncAverageRatings(feedbackService.getAverageRatingsByRoom());
    }
}
