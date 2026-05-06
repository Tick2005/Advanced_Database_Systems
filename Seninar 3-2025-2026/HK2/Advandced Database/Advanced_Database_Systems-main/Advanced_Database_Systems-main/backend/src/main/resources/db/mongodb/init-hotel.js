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
["sessions", "verification_tokens", "feedbacks", "activity_logs", "room_cache", "hotel_catalogs", "ratings"].forEach(ensureCollection);

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

db.ratings.createIndex({ booking_id: 1 }, { name: "ux_ratings_booking", unique: true });
db.ratings.createIndex({ room_type_id: 1, created_at: -1 }, { name: "idx_ratings_roomtype" });

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
    content: "Great stay, clean room and helpful staff.",
    created_at: new Date("2026-04-21T09:00:00Z"),
    updated_at: new Date("2026-04-21T10:00:00Z")
  },
  {
    _id: "feedback_demo_002",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777772",
    rating: 4,
    content: "View đẹp, nhân viên hỗ trợ nhanh.",
    created_at: new Date("2026-04-22T08:30:00Z"),
    updated_at: new Date("2026-04-22T08:30:00Z")
  },
  {
    _id: "feedback_demo_003",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777773",
    rating: 5,
    content: "Phòng gia đình rộng, sạch.",
    created_at: new Date("2026-05-03T10:00:00Z"),
    updated_at: new Date("2026-05-03T10:00:00Z")
  },
  {
    _id: "feedback_demo_004",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
    user_id: "44444444-4444-4444-4444-444444444444",
    room_id: "77777777-7777-7777-7777-777777777774",
    rating: 5,
    content: "Không gian yên tĩnh.",
    created_at: new Date("2026-05-05T15:45:00Z"),
    updated_at: new Date("2026-05-05T15:45:00Z")
  },
  {
    _id: "feedback_demo_005",
    booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5",
    user_id: "44444444-4444-4444-4444-444444444446",
    room_id: "77777777-7777-7777-7777-777777777775",
    rating: 2,
    content: "Phòng chưa tốt.",
    created_at: new Date("2026-04-29T08:30:00Z"),
    updated_at: new Date("2026-04-29T08:30:00Z")
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

upsertMany("ratings", [
  { _id: "rating_001", booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", room_type_id: "66666666-6666-6666-6666-666666666661", user_id: "44444444-4444-4444-4444-444444444444", score: 5, comment: "Phòng sạch đẹp, nhân viên tận tâm.", created_at: new Date("2026-04-22T09:00:00Z") },
  { _id: "rating_002", booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", room_type_id: "66666666-6666-6666-6666-666666666661", user_id: "44444444-4444-4444-4444-444444444445", score: 4, comment: "View đẹp, dịch vụ tốt.", created_at: new Date("2026-05-09T10:00:00Z") },
  { _id: "rating_003", booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3", room_type_id: "66666666-6666-6666-6666-666666666662", user_id: "44444444-4444-4444-4444-444444444446", score: 5, comment: "Phòng gia đình rất rộng và thoải mái.", created_at: new Date("2026-05-05T11:00:00Z") },
  { _id: "rating_004", booking_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7", room_type_id: "66666666-6666-6666-6666-666666666661", user_id: "44444444-4444-4444-4444-444444444448", score: 4, comment: "Ổn, sẽ quay lại.", created_at: new Date("2026-05-06T08:00:00Z") }
]);

// commit: feat(init-hotel.js): seed customer_settings cho demo users và thêm index user_id

// ── customer_settings collection ──────────────────────────────────────────────
ensureCollection("customer_settings");
db.customer_settings.createIndex(
  { user_id: 1 },
  { name: "ux_customer_settings_user_id", unique: true }
);

upsertMany("customer_settings", [
  {
    _id: "settings_owner_001",
    user_id: "33333333-3333-3333-3333-333333333333",
    theme: "dark",
    font_scale: "normal",
    allow_location: true,
    allow_camera: true,
    camera_device_id: null,
    created_at: new Date("2026-04-01T08:00:00Z"),
    updated_at: new Date("2026-04-01T08:00:00Z")
  },
  {
    _id: "settings_manager_001",
    user_id: "44444444-4444-4444-4444-444444444444",
    theme: "light",
    font_scale: "normal",
    allow_location: true,
    allow_camera: true,
    camera_device_id: null,
    created_at: new Date("2026-04-01T08:00:00Z"),
    updated_at: new Date("2026-04-01T08:00:00Z")
  },
  {
    _id: "settings_staff_001",
    user_id: "55555555-5555-5555-5555-555555555555",
    theme: "light",
    font_scale: "compact",
    allow_location: true,
    allow_camera: false,
    camera_device_id: null,
    created_at: new Date("2026-04-01T08:00:00Z"),
    updated_at: new Date("2026-04-01T08:00:00Z")
  },
  {
    _id: "settings_customer_001",
    user_id: "66666666-6666-6666-6666-666666666666",
    theme: "light",
    font_scale: "normal",
    allow_location: true,
    allow_camera: true,
    camera_device_id: null,
    created_at: new Date("2026-04-01T08:00:00Z"),
    updated_at: new Date("2026-04-01T08:00:00Z")
  }
]);
