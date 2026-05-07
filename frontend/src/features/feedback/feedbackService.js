import { httpClient } from "../../services/httpClient";

export const feedbackService = {
  getFeedbackByRoom: (roomId) => httpClient.get(`/api/public/feedbacks/${roomId}`),
  getMyFeedbacks: () => httpClient.get("/api/customer/feedbacks/my"),
  createFeedback: (payload) => httpClient.post("/api/customer/feedbacks", payload)
};
