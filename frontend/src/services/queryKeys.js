export const queryKeys = {
  rooms: (params = {}) => ["rooms", params],
  roomDetail: (id) => ["room-detail", id],
  topRoomTypes: ["top-room-types"],
  branches: ["branches"],
  bookings: ["bookings"],
  bookingDetail: (id) => ["booking-detail", id],
  profile: ["profile"],
  feedbackByRoom: (roomId) => ["feedback-by-room", roomId]
};
