import { httpClient } from "../../services/httpClient";

export const userService = {
  getProfile: () => httpClient.get("/api/customer/profile"),
  updateProfile: (payload) => httpClient.put("/api/customer/profile", payload)
};
