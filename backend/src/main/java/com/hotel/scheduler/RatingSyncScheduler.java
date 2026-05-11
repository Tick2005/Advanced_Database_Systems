package com.hotel.scheduler;

import com.hotel.modules.feedback.FeedbackService;
import com.hotel.modules.room.RoomService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class RatingSyncScheduler {

    private final FeedbackService feedbackService;
    private final RoomService roomService;

    public RatingSyncScheduler(FeedbackService feedbackService, RoomService roomService) {
        this.feedbackService = feedbackService;
        this.roomService = roomService;
    }

    @PostConstruct
    public void initSync() {
        // Run an initial sync at startup so room snapshots reflect feedback data immediately
        try {
            roomService.syncAverageRatings(feedbackService.getAverageRatingsByRoom());
        } catch (Exception ex) {
            // Don't prevent app startup on sync failure; log to stderr
            System.err.println("Initial rating sync failed: " + ex.getMessage());
        }
    }

    @Scheduled(fixedDelayString = "${app.scheduler.rating-sync-ms:300000}")
    public void syncRoomRatings() {
        roomService.syncAverageRatings(feedbackService.getAverageRatingsByRoom());
    }
}
