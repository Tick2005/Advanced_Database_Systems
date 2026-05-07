package com.hotel.modules.feedback.dto;

public class FeedbackReplyRequest {

    private String feedbackId;
    private String reply;

    public String getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(String feedbackId) {
        this.feedbackId = feedbackId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}