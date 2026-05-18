package com.hotel.modules.feedback.dto;

import jakarta.validation.constraints.NotBlank;

public class FeedbackReportRequest {
    @NotBlank(message = "Feedback ID is required")
    private String feedbackId;

    @NotBlank(message = "Reason is required")
    private String reason;

    public String getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(String feedbackId) {
        this.feedbackId = feedbackId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
