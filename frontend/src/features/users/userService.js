import { httpClient } from "../../services/httpClient";

export const userService = {
  getProfile: () => httpClient.get("/api/customer/profile"),
  updateProfile: (payload) => httpClient.put("/api/customer/profile", payload),
  updateEmail: (email) => httpClient.put("/api/customer/email", { email }),
  updatePassword: (payload) => httpClient.put("/api/customer/password", payload)
};
