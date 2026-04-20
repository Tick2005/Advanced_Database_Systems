import { httpClient } from "../../services/httpClient";

export const authService = {
  register: (payload) => httpClient.post("/api/auth/register", payload),
  login: (payload) => httpClient.post("/api/auth/login", payload),
  refreshToken: (refreshToken) => httpClient.post("/api/auth/refresh-token", { refreshToken }),
  forgotPassword: (email) => httpClient.post(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`),
  resetPassword: ({ email, token, newPassword }) =>
    httpClient.post(
      `/api/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`
    )
};
