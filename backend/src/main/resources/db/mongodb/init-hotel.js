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
["sessions", "verification_tokens", "feedbacks", "activity_logs", "room_cache", "hotel_catalogs", "customer_settings"].forEach(ensureCollection);

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

db.customer_settings.createIndex({ user_id: 1 }, { name: "ux_customer_settings_user_id", unique: true });
db.customer_settings.createIndex({ updated_at: -1 }, { name: "idx_customer_settings_updated_at" });

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
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777771",
    rating: 5,
    content: "Phòng rất sạch sẽ, view biển tuyệt đẹp. Nhân viên thân thiện và hỗ trợ nhanh chóng. Chắc chắn sẽ quay lại lần sau!",
    manager_reply: "Cảm ơn bạn đã ở lại với chúng tôi. Rất vui khi bạn có trải nghiệm tốt!",
    created_at: new Date("2026-04-21T09:00:00Z"),
    updated_at: new Date("2026-04-21T14:00:00Z")
  },
  {
    _id: "feedback_demo_002",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 4,
    content: "View đẹp từ tầng cao, nhân viên hỗ trợ rất nhanh khi tôi cần thêm khăn tắm. Bữa sáng phong phú. Trừ 1 sao vì điều hòa hơi ồn.",
    manager_reply: null,
    created_at: new Date("2026-04-22T08:30:00Z"),
    updated_at: new Date("2026-04-22T08:30:00Z")
  },
  {
    _id: "feedback_demo_003",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 5,
    content: "Phòng suite gia đình rất rộng và thoáng, đủ chỗ cho 4 người thoải mái. Bể bơi sạch, trẻ em rất thích. Tuyệt vời!",
    manager_reply: "Cảm ơn gia đình đã lựa chọn chúng tôi! Rất vui khi các bé thích bể bơi.",
    created_at: new Date("2026-05-03T10:00:00Z"),
    updated_at: new Date("2026-05-03T15:00:00Z")
  },
  {
    _id: "feedback_demo_004",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 5,
    content: "Không gian yên tĩnh, nệm êm, rèm cửa cách sáng tốt. Phù hợp để nghỉ ngơi sau chuyến công tác dài. Wifi tốc độ cao rất tiện.",
    manager_reply: null,
    created_at: new Date("2026-05-05T15:45:00Z"),
    updated_at: new Date("2026-05-05T15:45:00Z")
  },
  {
    _id: "feedback_demo_005",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5",
    user_id: "44444444-4444-4444-4444-444444444446",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 2,
    content: "Phòng chưa được dọn sạch khi check-in, còn rác từ khách trước. Đã báo lễ tân nhưng chờ 40 phút mới có người lên. Cần cải thiện.",
    manager_reply: "Chúng tôi xin lỗi chân thành về sự cố này. Chúng tôi đã ghi nhận và sẽ cải thiện quy trình kiểm tra phòng trước check-in.",
    created_at: new Date("2026-04-29T08:30:00Z"),
    updated_at: new Date("2026-04-29T11:00:00Z")
  },
  {
    _id: "feedback_demo_006",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6",
    user_id: "44444444-4444-4444-4444-444444444446",
    room_id: "77777777-7777-7777-7777-777777777771",
    rating: 5,
    content: "Lần này trải nghiệm hoàn hảo hơn nhiều! Phòng sạch, thơm, view biển hoàng hôn cực đẹp. Bữa sáng buffet rất ngon và đa dạng.",
    manager_reply: null,
    created_at: new Date("2026-05-06T09:00:00Z"),
    updated_at: new Date("2026-05-06T09:00:00Z")
  },
  {
    _id: "feedback_demo_007",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7",
    user_id: "44444444-4444-4444-4444-444444444447",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 3,
    content: "Phòng ổn, nhân viên lịch sự. Tuy nhiên wifi khá chậm vào buổi tối, hồ bơi đóng cửa sớm hơn giờ ghi trên website.",
    manager_reply: "Cảm ơn bạn đã phản hồi. Chúng tôi đang nâng cấp hệ thống wifi và sẽ cập nhật lại giờ mở cửa hồ bơi.",
    created_at: new Date("2026-05-03T12:00:00Z"),
    updated_at: new Date("2026-05-03T14:30:00Z")
  },
  {
    _id: "feedback_demo_008",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8",
    user_id: "44444444-4444-4444-4444-444444444447",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 5,
    content: "Suite penthouse tuyệt đỉnh! Jacuzzi ngoài ban công với view thành phố ban đêm không thể chê. Xứng đáng từng đồng. Nhân viên butler phục vụ tận tâm.",
    manager_reply: null,
    created_at: new Date("2026-05-04T16:00:00Z"),
    updated_at: new Date("2026-05-04T16:00:00Z")
  },
  {
    _id: "feedback_demo_009",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9",
    user_id: "44444444-4444-4444-4444-444444444448",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 4,
    content: "Phòng deluxe rất tốt, giá hợp lý cho chất lượng. Mini bar đầy đủ. Chỉ cần cải thiện thêm ánh sáng phòng tắm và bổ sung gương lớn hơn.",
    manager_reply: null,
    created_at: new Date("2026-05-01T10:30:00Z"),
    updated_at: new Date("2026-05-01T10:30:00Z")
  },
  {
    _id: "feedback_demo_010",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10",
    user_id: "44444444-4444-4444-4444-444444444448",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 5,
    content: "Trải nghiệm 5 sao thực sự. Check-in nhanh chỉ 5 phút, phòng chuẩn bị sẵn hoa tươi và trái cây theo yêu cầu. Sẽ giới thiệu cho bạn bè.",
    manager_reply: "Cảm ơn bạn rất nhiều! Chúng tôi rất vui được đón bạn và những người thân của bạn trong tương lai.",
    created_at: new Date("2026-05-02T08:00:00Z"),
    updated_at: new Date("2026-05-02T09:00:00Z")
  },
  {
    _id: "feedback_demo_011",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    user_id: "44444444-4444-4444-4444-444444444446",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 5,
    content: "Phòng rất đẹp và sạch sẽ. Tầm nhìn ra biển tuyệt vời! Nhân viên nhiệt tình.",
    manager_reply: "Cảm ơn bạn đã trải nghiệm tại LuxStay! Hẹn gặp lại bạn lần sau.",
    created_at: new Date("2026-05-06T10:00:00Z"),
    updated_at: new Date("2026-05-06T10:00:00Z")
  },
  {
    _id: "feedback_demo_012",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7",
    user_id: "44444444-4444-4444-4444-444444444448",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 4,
    content: "Giá cả hợp lý, phòng ốc tiện nghi. Tuy nhiên buffet sáng hơi ít món.",
    manager_reply: "Cảm ơn góp ý của bạn, chúng tôi sẽ cải thiện thực đơn buffet.",
    created_at: new Date("2026-05-07T14:30:00Z"),
    updated_at: new Date("2026-05-07T14:30:00Z")
  },
  {
    _id: "feedback_demo_013",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10",
    user_id: "44444444-4444-4444-4444-444444444447",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 5,
    content: "Trải nghiệm sang trọng thực sự. Giường ngủ cực kỳ êm ái, rất đáng tiền.",
    manager_reply: "Rất vui vì bạn hài lòng với dịch vụ phòng cao cấp của chúng tôi.",
    created_at: new Date("2026-05-08T09:15:00Z"),
    updated_at: new Date("2026-05-08T09:15:00Z")
  },
  {
    _id: "feedback_demo_014",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11",
    user_id: "44444444-4444-4444-4444-444444444446",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 4,
    content: "Không gian yên tĩnh, rất phù hợp để nghỉ ngơi cuối tuần. Sẽ quay lại.",
    manager_reply: null,
    created_at: new Date("2026-05-09T18:20:00Z"),
    updated_at: new Date("2026-05-09T18:20:00Z")
  },
  {
    _id: "feedback_demo_015",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12",
    user_id: "44444444-4444-4444-4444-444444444448",
    room_id: "77777777-7777-7777-7777-777777777771",
    rating: 5,
    content: "Mọi thứ đều hoàn hảo từ lúc check-in đến check-out. 10 điểm!",
    manager_reply: "LuxStay cảm ơn bạn đã cho chúng tôi 10 điểm!",
    created_at: new Date("2026-05-10T08:00:00Z"),
    updated_at: new Date("2026-05-10T08:00:00Z")
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

upsertDocument("customer_settings", {
  _id: "settings_demo_001",
  user_id: "44444444-4444-4444-4444-444444444444",
  theme: "light",
  fontScale: "normal",
  allowLocation: true,
  allowCamera: true,
  updated_at: new Date("2026-04-20T12:00:00Z")
});