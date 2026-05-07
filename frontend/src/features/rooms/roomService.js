import { httpClient } from "../../services/httpClient";

export const roomService = {
  getRooms: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return httpClient.get(`/api/public/rooms${suffix}`);
  },
  getRoomDetail: (id) => httpClient.get(`/api/public/rooms/${id}`),
  getTopRoomTypes: () => httpClient.get("/api/public/top-room-types")
};
