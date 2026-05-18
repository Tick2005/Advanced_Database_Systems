db = db.getSiblingDB("hotel");
function ensureCollection(name) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
  }
}

function upsertDocument(collectionName, document) {
  db.getCollection(collectionName).replaceOne({ _id: document._id }, document, { upsert: true });
}

function upsertMany(collectionName, documents) {
  documents.forEach((document) => upsertDocument(collectionName, document));
}

// Tạo collections
["sessions", "verification_tokens", "feedbacks", "activity_logs", "room_cache", "hotel_catalogs"].forEach(ensureCollection);

// Tạo indexes
db.sessions.createIndex({ expires_at: 1 }, { name: "ttl_sessions_expires_at", expireAfterSeconds: 0 });
db.sessions.createIndex({ user_id: 1, expires_at: -1 }, { name: "idx_sessions_user_expires" });

db.verification_tokens.createIndex({ expires_at: 1 }, { name: "ttl_verification_tokens_expires_at", expireAfterSeconds: 0 });
db.verification_tokens.createIndex({ token_hash: 1 }, { name: "ux_verification_token_hash", unique: true });

db.feedbacks.createIndex({ room_id: 1, created_at: -1 }, { name: "idx_feedbacks_room_created" });
db.feedbacks.createIndex({ booking_id: 1 }, { name: "ux_feedbacks_booking", unique: true });

db.activity_logs.createIndex({ user_id: 1, timestamp: -1 }, { name: "idx_activity_user_time" });
db.activity_logs.createIndex({ action: 1, target_type: 1, timestamp: -1 }, { name: "idx_activity_action_target_time" });

db.hotel_catalogs.createIndex({ hotel_id: 1 }, { name: "ux_hotel_catalog_hotel_id", unique: true });
db.hotel_catalogs.createIndex({ city: 1, is_active: 1 }, { name: "idx_hotel_catalog_city_active" });
db.hotel_catalogs.createIndex({ amenities: 1 }, { name: "idx_hotel_catalog_amenities" });
db.hotel_catalogs.createIndex({ description: "text", amenities: "text" }, { name: "idx_hotel_catalog_text_desc_amenities", default_language: "english" });

// customer_settings moved to Postgres migrations (seeded in V7__seed_data.sql)

// Seed dữ liệu
upsertDocument("sessions", {
  _id: "session_demo_001",
  user_id: "44444444-4444-4444-4444-444444444444",
  ip: "127.0.0.1",
  device_info: { os: "Windows", browser: "Chrome" },
  expires_at: new Date("2026-12-31T23:59:59Z")
});

upsertDocument("verification_tokens", {
  _id: "verify_demo_001",
  token_hash: "hash_demo_token_001",
  email: "customer@hotel.local",
  type: "EMAIL_VERIFY",
  expires_at: new Date("2026-12-31T23:59:59Z")
});

upsertMany("feedbacks", [
  {
    _id: "feedback_demo_001",
    booking_id: "fb-booking-001",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Nguyễn Văn A",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    room_id: "77777777-7777-7777-7777-777777777771",
    rating: 5,
    content: "Phòng rất sạch sẽ và nhân viên thân thiện. Rất phù hợp cho kỳ nghỉ cuối tuần.",
    manager_reply: "Cảm ơn bạn đã lựa chọn khách sạn. Rất vui được đón tiếp bạn!",
    created_at: new Date("2026-05-01T08:00:00Z"),
    updated_at: new Date("2026-05-01T08:00:00Z")
  },
  {
    _id: "feedback_demo_002",
    booking_id: "fb-booking-002",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    room_id: "77777777-7777-7777-7777-777777777771",
    rating: 4,
    content: "View đẹp, phòng thoải mái. Thức ăn sáng đa dạng nhưng có thể thêm món Việt hơn.",
    manager_reply: null,
    created_at: new Date("2026-05-02T09:30:00Z"),
    updated_at: new Date("2026-05-02T09:30:00Z")
  },
  {
    _id: "feedback_demo_003",
    booking_id: "fb-booking-003",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 5,
    content: "Phòng rộng rãi, ban công đẹp. Nhân viên hỗ trợ nhanh chóng khi tôi cần thêm bộ đồ dùng cá nhân.",
    manager_reply: "Cảm ơn quý khách đã phản hồi. Chúc quý khách một ngày tốt lành!",
    created_at: new Date("2026-05-03T11:00:00Z"),
    updated_at: new Date("2026-05-03T11:00:00Z")
  },
  {
    _id: "feedback_demo_004",
    booking_id: "fb-booking-004",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026027f",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 4,
    content: "Phòng đẹp, nhưng điều hòa hơi ồn. Tổng thể vẫn rất tốt cho chuyến công tác.",
    manager_reply: "Chúng tôi xin lỗi về tiếng ồn điều hòa. Chúng tôi sẽ kiểm tra và nâng cấp hệ thống.",
    created_at: new Date("2026-05-04T13:00:00Z"),
    updated_at: new Date("2026-05-04T13:00:00Z")
  },
  {
    _id: "feedback_demo_005",
    booking_id: "fb-booking-005",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026028g",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 5,
    content: "Phòng gia đình rất phù hợp, đủ chỗ cho cả gia đình 4 người. Hồ bơi cũng rất sạch.",
    manager_reply: "Rất vui vì gia đình đã có kỳ nghỉ tốt. Hẹn gặp lại quý khách!",
    created_at: new Date("2026-05-05T10:00:00Z"),
    updated_at: new Date("2026-05-05T10:00:00Z")
  },
  {
    _id: "feedback_demo_006",
    booking_id: "fb-booking-006",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 4,
    content: "Phòng sạch sẽ, không gian yên tĩnh. Rất phù hợp cho gia đình có trẻ nhỏ.",
    manager_reply: null,
    created_at: new Date("2026-05-06T08:45:00Z"),
    updated_at: new Date("2026-05-06T08:45:00Z")
  },
  {
    _id: "feedback_demo_007",
    booking_id: "fb-booking-007",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705h",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 3,
    content: "Phòng tốt, nhưng hệ thống wifi chậm vào buổi tối. Nhân viên rất lịch sự.",
    manager_reply: "Cảm ơn góp ý của bạn. Chúng tôi đang làm việc với nhà mạng để cải thiện wifi.",
    created_at: new Date("2026-05-07T12:30:00Z"),
    updated_at: new Date("2026-05-07T12:30:00Z")
  },
  {
    _id: "feedback_demo_008",
    booking_id: "fb-booking-008",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702i",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 4,
    content: "Phòng yên tĩnh, ánh sáng tốt. Thích hợp để nghỉ ngơi cuối tuần.",
    manager_reply: null,
    created_at: new Date("2026-05-08T09:20:00Z"),
    updated_at: new Date("2026-05-08T09:20:00Z")
  },
  {
    _id: "feedback_demo_009",
    booking_id: "fb-booking-009",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703j",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 5,
    content: "Phòng deluxe rất ấm cúng, phục vụ chuyên nghiệp. Buffet sáng ngon miệng.",
    manager_reply: "Cảm ơn bạn đã dành lời khen. Hẹn gặp lại bạn lần sau!",
    created_at: new Date("2026-05-09T10:15:00Z"),
    updated_at: new Date("2026-05-09T10:15:00Z")
  },
  {
    _id: "feedback_demo_010",
    booking_id: "fb-booking-010",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024k",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 4,
    content: "Phòng tốt, thuận tiện cho đi lại. Chỉ cần nâng cấp thêm khăn tắm và đồ dùng.",
    manager_reply: "Cảm ơn bạn. Chúng tôi đã ghi nhận và sẽ cải thiện dịch vụ phòng.",
    created_at: new Date("2026-05-10T11:00:00Z"),
    updated_at: new Date("2026-05-10T11:00:00Z")
  },
  {
    _id: "feedback_demo_011",
    booking_id: "fb-booking-011",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024l",
    room_id: "77777777-7777-7777-7777-777777777776",
    rating: 5,
    content: "Phòng gia đình lớn, rất thoải mái. Tuyệt vời khi đi cùng trẻ em.",
    manager_reply: "Rất vui khi nghe rằng gia đình bạn đã có trải nghiệm tốt.",
    created_at: new Date("2026-05-11T08:30:00Z"),
    updated_at: new Date("2026-05-11T08:30:00Z")
  },
  {
    _id: "feedback_demo_012",
    booking_id: "fb-booking-012",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705m",
    room_id: "77777777-7777-7777-7777-777777777776",
    rating: 4,
    content: "Phòng rộng, nội thất phù hợp. Dịch vụ lễ tân thân thiện.",
    manager_reply: null,
    created_at: new Date("2026-05-12T09:00:00Z"),
    updated_at: new Date("2026-05-12T09:00:00Z")
  },
  {
    _id: "feedback_demo_013",
    booking_id: "fb-booking-013",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702n",
    room_id: "77777777-7777-7777-7777-777777777777",
    rating: 5,
    content: "Phòng ở Đà Lạt rất thơ mộng, ấm cúng. Sẽ quay lại vào mùa hoa anh đào.",
    manager_reply: "Hẹn gặp lại bạn trong mùa hoa anh đào sắp tới!",
    created_at: new Date("2026-05-13T07:50:00Z"),
    updated_at: new Date("2026-05-13T07:50:00Z")
  },
  {
    _id: "feedback_demo_014",
    booking_id: "fb-booking-014",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703o",
    room_id: "77777777-7777-7777-7777-777777777777",
    rating: 4,
    content: "Phòng trong rừng thông rất yên tĩnh, rất lý tưởng để thư giãn.",
    manager_reply: "Cảm ơn bạn đã chọn Da Lat Hills. Rất vui được phục vụ bạn.",
    created_at: new Date("2026-05-14T08:15:00Z"),
    updated_at: new Date("2026-05-14T08:15:00Z")
  },
  {
    _id: "feedback_demo_015",
    booking_id: "fb-booking-015",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024p",
    room_id: "77777777-7777-7777-7777-777777777778",
    rating: 5,
    content: "Phòng cao cấp ở Đà Lạt đẹp và ấm áp. Thực đơn tối rất ngon.",
    manager_reply: "Rất vui vì bạn hài lòng với trải nghiệm ẩm thực và phòng ở.",
    created_at: new Date("2026-05-15T18:00:00Z"),
    updated_at: new Date("2026-05-15T18:00:00Z")
  },
  {
    _id: "feedback_demo_016",
    booking_id: "fb-booking-016",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024q",
    room_id: "77777777-7777-7777-7777-777777777778",
    rating: 4,
    content: "Phòng số 106 rất sạch và thoáng. Không gian gợi nhớ phong cách Đà Lạt.",
    manager_reply: null,
    created_at: new Date("2026-05-16T09:10:00Z"),
    updated_at: new Date("2026-05-16T09:10:00Z")
  },
  {
    _id: "feedback_demo_017",
    booking_id: "fb-booking-017",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705r",
    room_id: "77777777-7777-7777-7777-777777777779",
    rating: 5,
    content: "Phòng gia đình lớn ở Da Lat rất tiện nghi. Các bé thích ghế sofa và thảm chơi.",
    manager_reply: "Cảm ơn bạn đã ở cùng chúng tôi. Chúc gia đình bạn luôn khỏe mạnh.",
    created_at: new Date("2026-05-17T14:00:00Z"),
    updated_at: new Date("2026-05-17T14:00:00Z")
  },
  {
    _id: "feedback_demo_018",
    booking_id: "fb-booking-018",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702s",
    room_id: "77777777-7777-7777-7777-77777777777a",
    rating: 4,
    content: "Phòng biển ở Đà Nẵng rất thoáng, hồ bơi đẹp. Giá dịch vụ có thể hợp lý hơn.",
    manager_reply: "Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xem xét điều chỉnh giá dịch vụ.",
    created_at: new Date("2026-05-18T16:00:00Z"),
    updated_at: new Date("2026-05-18T16:00:00Z")
  },
  {
    _id: "feedback_demo_019",
    booking_id: "fb-booking-019",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703t",
    room_id: "77777777-7777-7777-7777-77777777777a",
    rating: 5,
    content: "Phòng chuẩn view biển, thiết kế hiện đại. Sẽ giới thiệu cho bạn bè.",
    manager_reply: "Rất vui khi bạn hài lòng với phòng và tầm nhìn biển.",
    created_at: new Date("2026-05-19T12:30:00Z"),
    updated_at: new Date("2026-05-19T12:30:00Z")
  },
  {
    _id: "feedback_demo_020",
    booking_id: "fb-booking-020",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024u",
    room_id: "77777777-7777-7777-7777-77777777777b",
    rating: 5,
    content: "Phòng deluxe trong xanh, gần bãi biển. Phòng tắm rộng và tiện nghi cao cấp.",
    manager_reply: null,
    created_at: new Date("2026-05-20T08:45:00Z"),
    updated_at: new Date("2026-05-20T08:45:00Z")
  },
  {
    _id: "feedback_demo_021",
    booking_id: "fb-booking-021",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024v",
    room_id: "77777777-7777-7777-7777-77777777777b",
    rating: 4,
    content: "Phòng deluxe gần biển rất ấn tượng. Nhân viên chào đón chu đáo.",
    manager_reply: "Cảm ơn bạn đã ở lại tại Da Nang Beach Hotel.",
    created_at: new Date("2026-05-21T10:00:00Z"),
    updated_at: new Date("2026-05-21T10:00:00Z")
  },
  {
    _id: "feedback_demo_022",
    booking_id: "fb-booking-022",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705w",
    room_id: "77777777-7777-7777-7777-77777777777c",
    rating: 5,
    content: "Phòng gia đình rộng rãi, thiết kế nội thất đẹp. Rất phù hợp cho nhóm bạn.",
    manager_reply: "Cảm ơn nhóm bạn đã chọn khách sạn. Rất mong được phục vụ lại.",
    created_at: new Date("2026-05-22T11:30:00Z"),
    updated_at: new Date("2026-05-22T11:30:00Z")
  },
  {
    _id: "feedback_demo_023",
    booking_id: "fb-booking-023",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702x",
    room_id: "77777777-7777-7777-7777-77777777777c",
    rating: 4,
    content: "Phòng rộng, tiện nghi đầy đủ. Chỉ cần cải thiện thêm trà/cà phê trong phòng.",
    manager_reply: "Cảm ơn ý kiến của bạn. Chúng tôi sẽ bổ sung thêm đồ uống trong phòng.",
    created_at: new Date("2026-05-23T09:45:00Z"),
    updated_at: new Date("2026-05-23T09:45:00Z")
  },
  {
    _id: "feedback_demo_024",
    booking_id: "fb-booking-024",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703y",
    room_id: "77777777-7777-7777-7777-77777777777c",
    rating: 5,
    content: "Tuyệt vời! Phòng gia đình và dịch vụ rất chuyên nghiệp. Mọi thứ đều tốt.",
    manager_reply: "Cảm ơn bạn đã cho chúng tôi cơ hội phục vụ. Chúc bạn một kỳ nghỉ thật tốt.",
    created_at: new Date("2026-05-24T13:00:00Z"),
    updated_at: new Date("2026-05-24T13:00:00Z")
  },

  // ── Hanoi Standard 103 (d1) ──────────────────────────────────────────────
  {
    _id: "feedback_demo_025",
    booking_id: "fb-booking-025",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024z1",
    room_id: "77777777-7777-7777-7777-7777777777d1",
    rating: 4,
    content: "Phòng standard yên tĩnh, sạch sẽ. Vị trí thuận tiện gần thang máy.",
    manager_reply: "Cảm ơn bạn đã lưu trú tại Hanoi Central Hotel. Hẹn gặp lại!",
    created_at: new Date("2026-05-25T08:00:00Z"),
    updated_at: new Date("2026-05-25T08:00:00Z")
  },
  {
    _id: "feedback_demo_026",
    booking_id: "fb-booking-026",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024z2",
    room_id: "77777777-7777-7777-7777-7777777777d1",
    rating: 5,
    content: "Phòng thoải mái, giường êm. Nhân viên lễ tân rất nhiệt tình hỗ trợ.",
    manager_reply: null,
    created_at: new Date("2026-05-25T14:30:00Z"),
    updated_at: new Date("2026-05-25T14:30:00Z")
  },

  // ── Hanoi Deluxe 202 (d2) ────────────────────────────────────────────────
  {
    _id: "feedback_demo_027",
    booking_id: "fb-booking-027",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705z3",
    room_id: "77777777-7777-7777-7777-7777777777d2",
    rating: 5,
    content: "Phòng deluxe nhìn ra hồ Hoàn Kiếm rất đẹp. Buổi sáng ngắm hồ thật tuyệt vời.",
    manager_reply: "Cảm ơn bạn đã chia sẻ. Tầm nhìn hồ Hoàn Kiếm là điểm đặc biệt của phòng này.",
    created_at: new Date("2026-05-26T09:00:00Z"),
    updated_at: new Date("2026-05-26T09:00:00Z")
  },
  {
    _id: "feedback_demo_028",
    booking_id: "fb-booking-028",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702z4",
    room_id: "77777777-7777-7777-7777-7777777777d2",
    rating: 4,
    content: "Phòng rộng rãi, nội thất sang trọng. Dịch vụ phòng nhanh chóng và chu đáo.",
    manager_reply: null,
    created_at: new Date("2026-05-26T16:00:00Z"),
    updated_at: new Date("2026-05-26T16:00:00Z")
  },

  // ── Hanoi Family 301 (d3) ────────────────────────────────────────────────
  {
    _id: "feedback_demo_029",
    booking_id: "fb-booking-029",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703z5",
    room_id: "77777777-7777-7777-7777-7777777777d3",
    rating: 5,
    content: "Phòng gia đình tầng cao, view toàn cảnh Hà Nội. Không gian rộng rãi cho cả gia đình.",
    manager_reply: "Cảm ơn gia đình bạn đã chọn phòng suite tầng cao. Hẹn gặp lại!",
    created_at: new Date("2026-05-27T10:00:00Z"),
    updated_at: new Date("2026-05-27T10:00:00Z")
  },
  {
    _id: "feedback_demo_030",
    booking_id: "fb-booking-030",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024z6",
    room_id: "77777777-7777-7777-7777-7777777777d3",
    rating: 4,
    content: "Phòng rất rộng, phù hợp cho nhóm đông người. Tiện nghi đầy đủ và hiện đại.",
    manager_reply: null,
    created_at: new Date("2026-05-27T18:00:00Z"),
    updated_at: new Date("2026-05-27T18:00:00Z")
  },

  // ── Ca Mau Standard 303 (e1) ─────────────────────────────────────────────
  {
    _id: "feedback_demo_031",
    booking_id: "fb-booking-031",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024z7",
    room_id: "77777777-7777-7777-7777-7777777777e1",
    rating: 4,
    content: "Phòng nhìn ra rừng đước rất độc đáo. Không khí trong lành, yên tĩnh tuyệt vời.",
    manager_reply: "Cảm ơn bạn đã trải nghiệm vẻ đẹp thiên nhiên Cà Mau cùng chúng tôi.",
    created_at: new Date("2026-05-28T07:30:00Z"),
    updated_at: new Date("2026-05-28T07:30:00Z")
  },
  {
    _id: "feedback_demo_032",
    booking_id: "fb-booking-032",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705z8",
    room_id: "77777777-7777-7777-7777-7777777777e1",
    rating: 3,
    content: "Phòng ổn, nhưng cần cải thiện hệ thống điều hòa. Vị trí gần thiên nhiên rất thích.",
    manager_reply: "Cảm ơn góp ý. Chúng tôi sẽ kiểm tra và nâng cấp hệ thống điều hòa sớm.",
    created_at: new Date("2026-05-28T15:00:00Z"),
    updated_at: new Date("2026-05-28T15:00:00Z")
  },

  // ── Ca Mau Deluxe 402 (e2) ───────────────────────────────────────────────
  {
    _id: "feedback_demo_033",
    booking_id: "fb-booking-033",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702z9",
    room_id: "77777777-7777-7777-7777-7777777777e2",
    rating: 5,
    content: "Phòng deluxe nhìn ra đồng bằng sông Cửu Long rất ấn tượng. Hoàng hôn đẹp mê hồn.",
    manager_reply: "Cảm ơn bạn đã chia sẻ. Tầm nhìn đồng bằng là niềm tự hào của Ca Mau Bay Hotel.",
    created_at: new Date("2026-05-29T08:00:00Z"),
    updated_at: new Date("2026-05-29T08:00:00Z")
  },
  {
    _id: "feedback_demo_034",
    booking_id: "fb-booking-034",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703za",
    room_id: "77777777-7777-7777-7777-7777777777e2",
    rating: 4,
    content: "Phòng sạch sẽ, thoáng mát. Nhân viên phục vụ nhiệt tình và thân thiện.",
    manager_reply: null,
    created_at: new Date("2026-05-29T14:00:00Z"),
    updated_at: new Date("2026-05-29T14:00:00Z")
  },

  // ── Ca Mau Family 501 (e3) ───────────────────────────────────────────────
  {
    _id: "feedback_demo_035",
    booking_id: "fb-booking-035",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zb",
    room_id: "77777777-7777-7777-7777-7777777777e3",
    rating: 5,
    content: "Phòng gia đình ven sông rất rộng và thoải mái. Trẻ em rất thích ngắm thuyền qua lại.",
    manager_reply: "Rất vui khi gia đình bạn có kỳ nghỉ vui vẻ bên dòng sông Cà Mau.",
    created_at: new Date("2026-05-30T09:00:00Z"),
    updated_at: new Date("2026-05-30T09:00:00Z")
  },
  {
    _id: "feedback_demo_036",
    booking_id: "fb-booking-036",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zc",
    room_id: "77777777-7777-7777-7777-7777777777e3",
    rating: 4,
    content: "Phòng rộng, đủ chỗ cho cả nhóm. Bữa sáng có nhiều món đặc sản miền Tây.",
    manager_reply: "Cảm ơn bạn đã thưởng thức ẩm thực địa phương. Hẹn gặp lại!",
    created_at: new Date("2026-05-30T17:00:00Z"),
    updated_at: new Date("2026-05-30T17:00:00Z")
  },

  // ── Da Lat Standard 107 (f1) ─────────────────────────────────────────────
  {
    _id: "feedback_demo_037",
    booking_id: "fb-booking-037",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705zd",
    room_id: "77777777-7777-7777-7777-7777777777f1",
    rating: 5,
    content: "Phòng nhìn ra rừng thông Đà Lạt rất thơ mộng. Buổi sáng sương mù bao phủ rất đẹp.",
    manager_reply: "Cảm ơn bạn đã cảm nhận vẻ đẹp thiên nhiên Đà Lạt cùng chúng tôi.",
    created_at: new Date("2026-05-31T07:00:00Z"),
    updated_at: new Date("2026-05-31T07:00:00Z")
  },
  {
    _id: "feedback_demo_038",
    booking_id: "fb-booking-038",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702ze",
    room_id: "77777777-7777-7777-7777-7777777777f1",
    rating: 4,
    content: "Phòng ấm áp, chăn gối dày dặn phù hợp với thời tiết Đà Lạt. Rất thoải mái.",
    manager_reply: null,
    created_at: new Date("2026-05-31T13:00:00Z"),
    updated_at: new Date("2026-05-31T13:00:00Z")
  },

  // ── Da Lat Deluxe 207 (f2) ───────────────────────────────────────────────
  {
    _id: "feedback_demo_039",
    booking_id: "fb-booking-039",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703zf",
    room_id: "77777777-7777-7777-7777-7777777777f2",
    rating: 5,
    content: "Phòng deluxe có lò sưởi rất ấm cúng. Ngồi bên lò sưởi uống trà Đà Lạt thật tuyệt.",
    manager_reply: "Cảm ơn bạn đã trải nghiệm không gian ấm cúng đặc trưng của Da Lat Hills.",
    created_at: new Date("2026-06-01T08:30:00Z"),
    updated_at: new Date("2026-06-01T08:30:00Z")
  },
  {
    _id: "feedback_demo_040",
    booking_id: "fb-booking-040",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zg",
    room_id: "77777777-7777-7777-7777-7777777777f2",
    rating: 4,
    content: "Phòng deluxe rộng rãi, ban công nhìn ra vườn hoa. Dịch vụ phòng rất chu đáo.",
    manager_reply: null,
    created_at: new Date("2026-06-01T16:00:00Z"),
    updated_at: new Date("2026-06-01T16:00:00Z")
  },

  // ── Da Lat Family 307 (f3) ───────────────────────────────────────────────
  {
    _id: "feedback_demo_041",
    booking_id: "fb-booking-041",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zh",
    room_id: "77777777-7777-7777-7777-7777777777f3",
    rating: 5,
    content: "Phòng gia đình view núi Đà Lạt rất hùng vĩ. Không gian rộng, phù hợp cho cả nhóm.",
    manager_reply: "Cảm ơn bạn đã chọn phòng suite tầng cao. Hẹn gặp lại trong mùa hoa tiếp theo!",
    created_at: new Date("2026-06-02T09:00:00Z"),
    updated_at: new Date("2026-06-02T09:00:00Z")
  },
  {
    _id: "feedback_demo_042",
    booking_id: "fb-booking-042",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705zi",
    room_id: "77777777-7777-7777-7777-7777777777f3",
    rating: 4,
    content: "Phòng rộng, đủ tiện nghi cho gia đình. Trẻ em thích không gian vui chơi trong phòng.",
    manager_reply: "Rất vui khi các bé có kỳ nghỉ vui vẻ tại Da Lat Hills Hotel.",
    created_at: new Date("2026-06-02T17:30:00Z"),
    updated_at: new Date("2026-06-02T17:30:00Z")
  },

  // ── Da Nang Standard 503 (g1) ────────────────────────────────────────────
  {
    _id: "feedback_demo_043",
    booking_id: "fb-booking-043",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702zj",
    room_id: "77777777-7777-7777-7777-77777777b001",
    rating: 5,
    content: "Phòng standard nhìn thẳng ra biển Mỹ Khê. Sóng biển ru ngủ rất dễ chịu.",
    manager_reply: "Cảm ơn bạn đã chọn Da Nang Beach Hotel. Biển Mỹ Khê luôn chào đón bạn!",
    created_at: new Date("2026-06-03T08:00:00Z"),
    updated_at: new Date("2026-06-03T08:00:00Z")
  },
  {
    _id: "feedback_demo_044",
    booking_id: "fb-booking-044",
    user_id: "44444444-4444-4444-4444-444444444447",
    customer_name: "Nguyễn Thị Cam",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026703zk",
    room_id: "77777777-7777-7777-7777-77777777b001",
    rating: 4,
    content: "Phòng sạch sẽ, gần bãi biển. Buổi sáng đi bộ ra biển chỉ mất 2 phút.",
    manager_reply: null,
    created_at: new Date("2026-06-03T15:00:00Z"),
    updated_at: new Date("2026-06-03T15:00:00Z")
  },

  // ── Da Nang Deluxe 601 (g2) ──────────────────────────────────────────────
  {
    _id: "feedback_demo_045",
    booking_id: "fb-booking-045",
    user_id: "44444444-4444-4444-4444-444444444448",
    customer_name: "Do Thanh Long",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zl",
    room_id: "77777777-7777-7777-7777-77777777b002",
    rating: 5,
    content: "Phòng deluxe tầng 6 nhìn hoàng hôn xuống biển cực đẹp. Trải nghiệm không thể quên.",
    manager_reply: "Cảm ơn bạn đã chia sẻ khoảnh khắc hoàng hôn tuyệt đẹp. Hẹn gặp lại!",
    created_at: new Date("2026-06-04T09:00:00Z"),
    updated_at: new Date("2026-06-04T09:00:00Z")
  },
  {
    _id: "feedback_demo_046",
    booking_id: "fb-booking-046",
    user_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Demo Customer",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024zm",
    room_id: "77777777-7777-7777-7777-77777777b002",
    rating: 4,
    content: "Phòng deluxe sang trọng, nội thất hiện đại. Dịch vụ spa đi kèm rất thư giãn.",
    manager_reply: null,
    created_at: new Date("2026-06-04T17:00:00Z"),
    updated_at: new Date("2026-06-04T17:00:00Z")
  },

  // ── Da Nang Family 603 (g3) ──────────────────────────────────────────────
  {
    _id: "feedback_demo_047",
    booking_id: "fb-booking-047",
    user_id: "44444444-4444-4444-4444-444444444445",
    customer_name: "Trần Minh Anh",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026705zn",
    room_id: "77777777-7777-7777-7777-77777777b003",
    rating: 5,
    content: "Phòng gia đình beachfront tuyệt vời. Mở cửa sổ là nghe tiếng sóng biển, cực kỳ thư giãn.",
    manager_reply: "Cảm ơn gia đình bạn đã chọn phòng beachfront. Rất mong được đón tiếp lại!",
    created_at: new Date("2026-06-05T10:00:00Z"),
    updated_at: new Date("2026-06-05T10:00:00Z")
  },
  {
    _id: "feedback_demo_048",
    booking_id: "fb-booking-048",
    user_id: "44444444-4444-4444-4444-444444444446",
    customer_name: "Lê Gia Huy",
    avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026702zo",
    room_id: "77777777-7777-7777-7777-77777777b003",
    rating: 4,
    content: "Phòng rộng, đủ chỗ cho cả nhóm 4 người. Bãi biển riêng của khách sạn rất sạch.",
    manager_reply: "Cảm ơn bạn đã trải nghiệm bãi biển riêng của Da Nang Beach Hotel.",
    created_at: new Date("2026-06-05T18:00:00Z"),
    updated_at: new Date("2026-06-05T18:00:00Z")
  }
]);

upsertMany("activity_logs", [
  {
    _id: "activity_demo_001",
    user_id: "44444444-4444-4444-4444-444444444444",
    action: "SEARCH",
    target_type: "ROOM",
    target_id: "66666666-6666-6666-6666-666666666661",
    details: { filters: { city: "Da Nang", rating: 4 } },
    timestamp: new Date("2026-04-20T07:30:00Z")
  },
  {
    _id: "activity_demo_002",
    user_id: "44444444-4444-4444-4444-444444444444",
    action: "BOOK",
    target_type: "BOOKING",
    target_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    details: { source: "web" },
    timestamp: new Date("2026-04-20T08:15:00Z")
  },
  {
    _id: "activity_demo_003",
    user_id: "44444444-4444-4444-4444-444444444445",
    action: "CHECKOUT",
    target_type: "BOOKING",
    target_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    details: { source: "staff-app", branch_id: "55555555-5555-5555-5555-555555555551" },
    timestamp: new Date("2026-05-05T11:30:00Z")
  },
  {
    _id: "activity_demo_004",
    user_id: "22222222-2222-2222-2222-222222222223",
    action: "APPROVE_PRICING",
    target_type: "PRICING_REQUEST",
    target_id: "dd000002-0000-0000-0000-000000000002",
    details: { source: "owner-dashboard" },
    timestamp: new Date("2026-05-06T09:00:00Z")
  },
  {
    _id: "activity_demo_005",
    user_id: "44444444-4444-4444-4444-444444444445",
    action: "REVIEW_SUBMIT",
    target_type: "FEEDBACK",
    target_id: "feedback_demo_006",
    details: { rating: 5 },
    timestamp: new Date("2026-05-06T09:22:00Z")
  },
  {
    _id: "activity_demo_006",
    user_id: "44444444-4444-4444-4444-444444444446",
    action: "REVIEW_SUBMIT",
    target_type: "FEEDBACK",
    target_id: "feedback_demo_007",
    details: { rating: 3 },
    timestamp: new Date("2026-05-03T12:03:00Z")
  }
]);

upsertMany("hotel_catalogs", [
  {
    _id: "catalog_demo_001",
    hotel_id: "55555555-5555-5555-5555-555555555551",
    hotel_name: "Da Nang Center Hotel",
    city: "Da Nang",
    country: "Vietnam",
    is_active: true,
    description: "Beachside city-center resort with fast check-in and family-friendly services.",
    amenities: ["pool", "spa", "wifi", "airport-shuttle", "breakfast"],
    images: [
      "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg"
    ],
    search_tags: ["family", "beach", "premium"],
    last_synced_at: new Date("2026-04-17T09:00:00Z"),
    updated_at: new Date("2026-04-17T09:00:00Z")
  },
  {
    _id: "catalog_demo_002",
    hotel_id: "55555555-5555-5555-5555-555555555552",
    hotel_name: "HCM Riverside Hotel",
    city: "Ho Chi Minh",
    country: "Vietnam",
    is_active: true,
    description: "Business-oriented river view hotel focused on high availability room discovery.",
    amenities: ["wifi", "workspace", "gym", "pool"],
    images: [
      "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
      "https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg"
    ],
    search_tags: ["business", "city", "river-view"],
    last_synced_at: new Date("2026-04-17T09:05:00Z"),
    updated_at: new Date("2026-04-17T09:05:00Z")
  }
]);

// migrated customer_settings seeding removed from Mongo init
