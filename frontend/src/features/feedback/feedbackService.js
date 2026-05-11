import { httpClient } from "../../services/httpClient";

export const feedbackService = {
  getFeedbackByRoom: (roomId) => httpClient.get(`/api/public/feedbacks/${roomId}`),
  getTopFeedbacks: (limit = 10) => httpClient.get(`/api/public/feedbacks/top?limit=${limit}`),
  getRoomFeedbackSummaries: (roomIds = []) => {
    const search = new URLSearchParams();
    roomIds.filter(Boolean).forEach((roomId) => search.append("roomIds", roomId));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return httpClient.get(`/api/public/feedbacks/summary${suffix}`);
  },
  getMyFeedbacks: () => httpClient.get("/api/customer/feedbacks/my"),
  createFeedback: (payload) => httpClient.post("/api/customer/feedbacks", payload)
};
