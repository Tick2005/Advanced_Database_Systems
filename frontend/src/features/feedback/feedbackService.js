import { httpClient } from "../../services/httpClient";

export const feedbackService = {
  getFeedbackByRoom: (roomId) => httpClient.get(`/api/public/feedbacks/${roomId}`),
  getTopFeedbacks: (limit = 10) => httpClient.get(`/api/public/feedbacks/top?limit=${limit}`),
  getRoomFeedbackSummaries: (roomIds = []) => httpClient.post("/api/public/feedbacks/summary", { roomIds }),
  getMyFeedbacks: () => httpClient.get("/api/customer/feedbacks/my"),
  createFeedback: (payload) => httpClient.post("/api/customer/feedbacks", payload)
};
