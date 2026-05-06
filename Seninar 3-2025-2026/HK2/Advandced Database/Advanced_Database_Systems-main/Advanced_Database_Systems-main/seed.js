/**
 * LuxStay Hotel — MongoDB Seed Script
 * Usage:  mongosh mongodb://localhost:27017/hotel seed.js
 *
 * Clears and repopulates all core collections with realistic demo data.
 * Passwords are BCrypt hashes of "Password@123".
 */

// ── helpers ──────────────────────────────────────────────────────────────────
const now = new Date();
const daysAgo  = (n) => new Date(now - n * 864e5);
const daysFrom = (n) => new Date(now + n * 864e5);
const bcryptHash = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi."; // Password@123

function id()  { return new ObjectId(); }
function uid() { return id().toString(); }

// ── IDs ──────────────────────────────────────────────────────────────────────
const branchHanoiId  = id();
const branchSaigonId = id();
const branchDaNangId = id();

const ownerUserId   = id();
const mgrHanoiId    = id();
const mgrSaigonId   = id();
const staff1Id      = id();
const staff2Id      = id();
const staff3Id      = id();
const cust1Id       = id();
const cust2Id       = id();
const cust3Id       = id();

const room101 = id(), room102 = id(), room201 = id(), room202 = id();
const roomS01 = id(), roomS02 = id(), roomS03 = id();
const roomDN1 = id(), roomDN2 = id();

const svc_bfast_hn = id(), svc_spa_hn = id(), svc_laundry_hn = id();
const svc_bfast_sg = id(), svc_spa_sg = id();

const bk1 = id(), bk2 = id(), bk3 = id(), bk4 = id(), bk5 = id();

const pricing1 = id(), pricing2 = id(), pricing3 = id();

// ── clear existing data ───────────────────────────────────────────────────────
const COLLECTIONS = ["users","profiles","branches","rooms","services","bookings",
  "booking_services","feedbacks","pricing","pricing_requests","pricing_logs",
  "customer_settings","activity_logs","login_attempts","password_reset_tokens",
  "vnpay_callback_audits","user_branch_assignments"];

COLLECTIONS.forEach((c) => { try { db[c].drop(); } catch(e) {} });
print("✅ Dropped existing collections");

// ── BRANCHES ─────────────────────────────────────────────────────────────────
db.branches.insertMany([
  {
    _id: branchHanoiId,
    name: "LuxStay Hà Nội",
    code: "HN01",
    address: "12 Hoàn Kiếm, Hà Nội",
    city: "Hà Nội",
    country: "Việt Nam",
    phone: "024-3825-1234",
    email: "hanoi@luxstay.vn",
    description: "Chi nhánh trung tâm Hà Nội, view Hồ Gươm tuyệt đẹp.",
    starRating: 5,
    latitude: 21.0285, longitude: 105.8542,
    amenities: ["Pool","Spa","Restaurant","Gym","Parking"],
    active: true, createdAt: daysAgo(180), updatedAt: now
  },
  {
    _id: branchSaigonId,
    name: "LuxStay Sài Gòn",
    code: "SG01",
    address: "45 Nguyễn Huệ, Q.1, TP.HCM",
    city: "Hồ Chí Minh",
    country: "Việt Nam",
    phone: "028-3822-5678",
    email: "saigon@luxstay.vn",
    description: "Chi nhánh trung tâm Sài Gòn, view phố đi bộ.",
    starRating: 5,
    latitude: 10.7769, longitude: 106.7009,
    amenities: ["Pool","Spa","Restaurant","Bar","Gym","Parking"],
    active: true, createdAt: daysAgo(150), updatedAt: now
  },
  {
    _id: branchDaNangId,
    name: "LuxStay Đà Nẵng",
    code: "DN01",
    address: "88 Trần Phú, Đà Nẵng",
    city: "Đà Nẵng",
    country: "Việt Nam",
    phone: "0236-3823-9999",
    email: "danang@luxstay.vn",
    description: "Chi nhánh biển Đà Nẵng — sát bãi Mỹ Khê.",
    starRating: 4,
    latitude: 16.0544, longitude: 108.2022,
    amenities: ["BeachAccess","Pool","Restaurant","Parking"],
    active: true, createdAt: daysAgo(90), updatedAt: now
  }
]);
print("✅ Branches seeded");

// ── USERS ─────────────────────────────────────────────────────────────────────
db.users.insertMany([
  // Owner
  { _id: ownerUserId, email: "owner@luxstay.vn", password: bcryptHash, role: "OWNER",
    active: true, emailVerified: true, branchId: null,
    createdAt: daysAgo(200), updatedAt: now },

  // Managers
  { _id: mgrHanoiId, email: "manager.hanoi@luxstay.vn", password: bcryptHash, role: "MANAGER",
    active: true, emailVerified: true, branchId: branchHanoiId.toString(),
    createdAt: daysAgo(170), updatedAt: now },
  { _id: mgrSaigonId, email: "manager.saigon@luxstay.vn", password: bcryptHash, role: "MANAGER",
    active: true, emailVerified: true, branchId: branchSaigonId.toString(),
    createdAt: daysAgo(140), updatedAt: now },

  // Staff
  { _id: staff1Id, email: "staff1.hanoi@luxstay.vn", password: bcryptHash, role: "STAFF",
    active: true, emailVerified: true, branchId: branchHanoiId.toString(),
    createdAt: daysAgo(120), updatedAt: now },
  { _id: staff2Id, email: "staff2.hanoi@luxstay.vn", password: bcryptHash, role: "STAFF",
    active: true, emailVerified: true, branchId: branchHanoiId.toString(),
    createdAt: daysAgo(100), updatedAt: now },
  { _id: staff3Id, email: "staff1.saigon@luxstay.vn", password: bcryptHash, role: "STAFF",
    active: true, emailVerified: true, branchId: branchSaigonId.toString(),
    createdAt: daysAgo(80), updatedAt: now },

  // Customers
  { _id: cust1Id, email: "alice@example.com", password: bcryptHash, role: "CUSTOMER",
    active: true, emailVerified: true, branchId: null,
    createdAt: daysAgo(60), updatedAt: now },
  { _id: cust2Id, email: "bob@example.com", password: bcryptHash, role: "CUSTOMER",
    active: true, emailVerified: true, branchId: null,
    createdAt: daysAgo(45), updatedAt: now },
  { _id: cust3Id, email: "charlie@example.com", password: bcryptHash, role: "CUSTOMER",
    active: false, emailVerified: false, branchId: null,
    createdAt: daysAgo(10), updatedAt: now },
]);
print("✅ Users seeded");

// ── PROFILES ──────────────────────────────────────────────────────────────────
db.profiles.insertMany([
  { userId: ownerUserId.toString(),  fullName: "Nguyễn Văn Owner",  phone: "0901234567", address: "Hà Nội", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(200), updatedAt: now },
  { userId: mgrHanoiId.toString(),   fullName: "Trần Thị Manager",  phone: "0912345678", address: "Hà Nội", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(170), updatedAt: now },
  { userId: mgrSaigonId.toString(),  fullName: "Lê Văn Manager",    phone: "0923456789", address: "TP.HCM", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(140), updatedAt: now },
  { userId: staff1Id.toString(),     fullName: "Phạm Thị Nhân",     phone: "0934567890", address: "Hà Nội", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(120), updatedAt: now },
  { userId: staff2Id.toString(),     fullName: "Đỗ Văn Nhân",       phone: "0945678901", address: "Hà Nội", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(100), updatedAt: now },
  { userId: staff3Id.toString(),     fullName: "Vũ Thị Nhân",       phone: "0956789012", address: "TP.HCM", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(80),  updatedAt: now },
  { userId: cust1Id.toString(),      fullName: "Alice Nguyễn",      phone: "0967890123", address: "Đà Nẵng", preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(60), updatedAt: now },
  { userId: cust2Id.toString(),      fullName: "Bob Trần",          phone: "0978901234", address: "Hà Nội", preferredLanguage: "en", avatarUrl: null, createdAt: daysAgo(45),  updatedAt: now },
  { userId: cust3Id.toString(),      fullName: "Charlie Lê",        phone: null,          address: null,   preferredLanguage: "vi", avatarUrl: null, createdAt: daysAgo(10),  updatedAt: now },
]);
print("✅ Profiles seeded");

// ── CUSTOMER SETTINGS ────────────────────────────────────────────────────────
[cust1Id, cust2Id, cust3Id].forEach((uid) => {
  db.customer_settings.insertOne({
    userId: uid.toString(), theme: "light", fontScale: "normal",
    allowLocation: true, allowCamera: true,
    createdAt: daysAgo(30), updatedAt: now
  });
});
print("✅ Customer settings seeded");

// ── ROOMS ─────────────────────────────────────────────────────────────────────
db.rooms.insertMany([
  // Hanoi rooms
  { _id: room101, branchId: branchHanoiId.toString(), roomNumber: "101", roomType: "STANDARD",
    description: "Phòng Standard view thành phố, 30m²",
    pricePerNight: 800000, capacity: 2, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","Minibar"], images: [], averageRating: 4.5,
    floor: 1, bedType: "QUEEN", area: 30, createdAt: daysAgo(170), updatedAt: now },
  { _id: room102, branchId: branchHanoiId.toString(), roomNumber: "102", roomType: "STANDARD",
    description: "Phòng Standard view hồ, 30m²",
    pricePerNight: 900000, capacity: 2, status: "OCCUPIED",
    amenities: ["AC","TV","Wifi","Minibar"], images: [], averageRating: 4.7,
    floor: 1, bedType: "QUEEN", area: 30, createdAt: daysAgo(170), updatedAt: now },
  { _id: room201, branchId: branchHanoiId.toString(), roomNumber: "201", roomType: "DELUXE",
    description: "Phòng Deluxe view hồ Gươm, 45m²",
    pricePerNight: 1500000, capacity: 2, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","Minibar","Bathtub","LakeView"], images: [], averageRating: 4.8,
    floor: 2, bedType: "KING", area: 45, createdAt: daysAgo(170), updatedAt: now },
  { _id: room202, branchId: branchHanoiId.toString(), roomNumber: "202", roomType: "SUITE",
    description: "Suite Presidential, 90m²",
    pricePerNight: 3500000, capacity: 4, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","Minibar","Jacuzzi","LakeView","PrivatePool"], images: [], averageRating: 4.9,
    floor: 2, bedType: "KING", area: 90, createdAt: daysAgo(170), updatedAt: now },

  // Saigon rooms
  { _id: roomS01, branchId: branchSaigonId.toString(), roomNumber: "A01", roomType: "STANDARD",
    description: "Phòng Standard hiện đại, 32m²",
    pricePerNight: 950000, capacity: 2, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","Minibar"], images: [], averageRating: 4.4,
    floor: 1, bedType: "QUEEN", area: 32, createdAt: daysAgo(140), updatedAt: now },
  { _id: roomS02, branchId: branchSaigonId.toString(), roomNumber: "A02", roomType: "DELUXE",
    description: "Phòng Deluxe view phố đi bộ, 48m²",
    pricePerNight: 1800000, capacity: 2, status: "CLEANING",
    amenities: ["AC","TV","Wifi","Minibar","Balcony","CityView"], images: [], averageRating: 4.6,
    floor: 1, bedType: "KING", area: 48, createdAt: daysAgo(140), updatedAt: now },
  { _id: roomS03, branchId: branchSaigonId.toString(), roomNumber: "B01", roomType: "SUITE",
    description: "Suite hạng sang 80m², tầng thượng",
    pricePerNight: 4000000, capacity: 4, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","Minibar","Jacuzzi","CityView","Bar"], images: [], averageRating: 5.0,
    floor: 2, bedType: "KING", area: 80, createdAt: daysAgo(140), updatedAt: now },

  // Da Nang rooms
  { _id: roomDN1, branchId: branchDaNangId.toString(), roomNumber: "101", roomType: "STANDARD",
    description: "Phòng Standard view biển, 35m²",
    pricePerNight: 700000, capacity: 2, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","OceanView"], images: [], averageRating: 4.3,
    floor: 1, bedType: "TWIN", area: 35, createdAt: daysAgo(85), updatedAt: now },
  { _id: roomDN2, branchId: branchDaNangId.toString(), roomNumber: "201", roomType: "DELUXE",
    description: "Phòng Deluxe view biển trực tiếp, 50m²",
    pricePerNight: 1200000, capacity: 2, status: "AVAILABLE",
    amenities: ["AC","TV","Wifi","OceanView","Balcony"], images: [], averageRating: 4.8,
    floor: 2, bedType: "KING", area: 50, createdAt: daysAgo(85), updatedAt: now },
]);
print("✅ Rooms seeded");

// ── SERVICES ──────────────────────────────────────────────────────────────────
db.services.insertMany([
  // Hanoi
  { _id: svc_bfast_hn, branchId: branchHanoiId.toString(), name: "Bữa sáng buffet", description: "Buffet sáng phong phú", price: 150000, mode: "PER_PERSON", active: true, createdAt: daysAgo(160), updatedAt: now },
  { _id: svc_spa_hn,   branchId: branchHanoiId.toString(), name: "Spa trị liệu 60 phút", description: "Massage thư giãn", price: 500000, mode: "PER_SESSION", active: true, createdAt: daysAgo(160), updatedAt: now },
  { _id: svc_laundry_hn, branchId: branchHanoiId.toString(), name: "Giặt ủi", description: "Giặt ủi trong ngày", price: 80000, mode: "PER_ITEM", active: true, createdAt: daysAgo(160), updatedAt: now },
  // Saigon
  { _id: svc_bfast_sg, branchId: branchSaigonId.toString(), name: "Bữa sáng Set menu", description: "Set sáng á âu", price: 120000, mode: "PER_PERSON", active: true, createdAt: daysAgo(130), updatedAt: now },
  { _id: svc_spa_sg,   branchId: branchSaigonId.toString(), name: "Spa thảo dược 90 phút", description: "Liệu pháp thảo dược", price: 650000, mode: "PER_SESSION", active: true, createdAt: daysAgo(130), updatedAt: now },
]);
print("✅ Services seeded");

// ── PRICING ───────────────────────────────────────────────────────────────────
db.pricing.insertMany([
  { _id: pricing1, branchId: branchHanoiId.toString(), roomType: "STANDARD",  baseRate: 800000, weekendRate: 950000,  seasonRate: 1100000, currency: "VND", effectiveFrom: daysAgo(160), effectiveTo: daysFrom(200), active: true, createdAt: daysAgo(160), updatedAt: now },
  { _id: pricing2, branchId: branchHanoiId.toString(), roomType: "DELUXE",    baseRate: 1500000, weekendRate: 1750000, seasonRate: 2100000, currency: "VND", effectiveFrom: daysAgo(160), effectiveTo: daysFrom(200), active: true, createdAt: daysAgo(160), updatedAt: now },
  { _id: pricing3, branchId: branchSaigonId.toString(), roomType: "STANDARD", baseRate: 950000, weekendRate: 1100000, seasonRate: 1300000, currency: "VND", effectiveFrom: daysAgo(130), effectiveTo: daysFrom(200), active: true, createdAt: daysAgo(130), updatedAt: now },
]);
print("✅ Pricing seeded");

// ── BOOKINGS ─────────────────────────────────────────────────────────────────
db.bookings.insertMany([
  {
    _id: bk1, customerId: cust1Id.toString(), branchId: branchHanoiId.toString(), roomId: room102.toString(),
    roomNumber: "102", roomTypeName: "Standard", branchName: "LuxStay Hà Nội",
    checkInDate: daysAgo(5), checkOutDate: daysAgo(2),
    totalPrice: 2700000, status: "CHECKED_OUT", paymentStatus: "PAID",
    guestCount: 2, specialRequests: "Chăn gối mềm",
    createdAt: daysAgo(10), updatedAt: daysAgo(2)
  },
  {
    _id: bk2, customerId: cust1Id.toString(), branchId: branchHanoiId.toString(), roomId: room201.toString(),
    roomNumber: "201", roomTypeName: "Deluxe", branchName: "LuxStay Hà Nội",
    checkInDate: now, checkOutDate: daysFrom(3),
    totalPrice: 4500000, status: "CHECKED_IN", paymentStatus: "PAID",
    guestCount: 2, specialRequests: null,
    createdAt: daysAgo(7), updatedAt: now
  },
  {
    _id: bk3, customerId: cust2Id.toString(), branchId: branchSaigonId.toString(), roomId: roomS01.toString(),
    roomNumber: "A01", roomTypeName: "Standard", branchName: "LuxStay Sài Gòn",
    checkInDate: daysFrom(5), checkOutDate: daysFrom(8),
    totalPrice: 2850000, status: "CONFIRMED", paymentStatus: "PAID",
    guestCount: 1, specialRequests: "Late check-in 22h",
    createdAt: daysAgo(3), updatedAt: daysAgo(3)
  },
  {
    _id: bk4, customerId: cust2Id.toString(), branchId: branchHanoiId.toString(), roomId: room101.toString(),
    roomNumber: "101", roomTypeName: "Standard", branchName: "LuxStay Hà Nội",
    checkInDate: daysFrom(10), checkOutDate: daysFrom(12),
    totalPrice: 1600000, status: "HOLD", paymentStatus: "PENDING",
    guestCount: 2, specialRequests: null,
    createdAt: daysAgo(1), updatedAt: daysAgo(1)
  },
  {
    _id: bk5, customerId: cust1Id.toString(), branchId: branchDaNangId.toString(), roomId: roomDN2.toString(),
    roomNumber: "201", roomTypeName: "Deluxe", branchName: "LuxStay Đà Nẵng",
    checkInDate: daysAgo(30), checkOutDate: daysAgo(27),
    totalPrice: 3600000, status: "CHECKED_OUT", paymentStatus: "PAID",
    guestCount: 2, specialRequests: "Tầng cao view biển",
    createdAt: daysAgo(40), updatedAt: daysAgo(27)
  },
]);
print("✅ Bookings seeded");

// ── BOOKING SERVICES ─────────────────────────────────────────────────────────
db.booking_services.insertMany([
  { bookingId: bk1.toString(), serviceId: svc_bfast_hn.toString(), serviceName: "Bữa sáng buffet", quantity: 2, unitPrice: 150000, totalPrice: 300000, status: "CONSUMED", createdAt: daysAgo(10), updatedAt: daysAgo(2) },
  { bookingId: bk2.toString(), serviceId: svc_spa_hn.toString(),   serviceName: "Spa trị liệu 60 phút", quantity: 1, unitPrice: 500000, totalPrice: 500000, status: "REQUESTED", createdAt: daysAgo(6), updatedAt: now },
  { bookingId: bk5.toString(), serviceId: svc_bfast_sg.toString(), serviceName: "Bữa sáng Set menu", quantity: 2, unitPrice: 120000, totalPrice: 360000, status: "CONSUMED", createdAt: daysAgo(40), updatedAt: daysAgo(27) },
]);
print("✅ Booking services seeded");

// ── FEEDBACKS ─────────────────────────────────────────────────────────────────
db.feedbacks.insertMany([
  {
    bookingId: bk1.toString(), customerId: cust1Id.toString(), customerName: "Alice Nguyễn",
    roomId: room102.toString(), roomNumber: "102", branchId: branchHanoiId.toString(),
    rating: 5, title: "Tuyệt vời!", content: "Phòng sạch đẹp, nhân viên nhiệt tình. Sẽ quay lại!",
    reply: null, reported: false,
    createdAt: daysAgo(2), updatedAt: daysAgo(2)
  },
  {
    bookingId: bk5.toString(), customerId: cust1Id.toString(), customerName: "Alice Nguyễn",
    roomId: roomDN2.toString(), roomNumber: "201", branchId: branchDaNangId.toString(),
    rating: 4, title: "Rất thích view biển", content: "View biển đẹp, giường thoải mái. Buffet sáng hơi ít lựa chọn.",
    reply: "Cảm ơn quý khách! Chúng tôi sẽ cải thiện menu buffet.", reported: false,
    createdAt: daysAgo(25), updatedAt: daysAgo(24)
  },
]);
print("✅ Feedbacks seeded");

// ── PRICING REQUESTS ──────────────────────────────────────────────────────────
db.pricing_requests.insertMany([
  {
    requestedBy: mgrHanoiId.toString(), branchId: branchHanoiId.toString(),
    roomType: "DELUXE", proposedBaseRate: 1650000,
    proposedWeekendRate: 1900000, proposedSeasonRate: 2300000,
    reason: "Tăng giá theo mùa du lịch hè 2025",
    status: "PENDING", reviewNote: null, reviewedBy: null,
    createdAt: daysAgo(3), updatedAt: daysAgo(3)
  },
  {
    requestedBy: mgrSaigonId.toString(), branchId: branchSaigonId.toString(),
    roomType: "STANDARD", proposedBaseRate: 1050000,
    proposedWeekendRate: 1200000, proposedSeasonRate: 1400000,
    reason: "Điều chỉnh cạnh tranh theo thị trường Q3",
    status: "APPROVED", reviewNote: "Đồng ý", reviewedBy: ownerUserId.toString(),
    createdAt: daysAgo(15), updatedAt: daysAgo(12)
  },
]);
print("✅ Pricing requests seeded");

// ── INDEXES ───────────────────────────────────────────────────────────────────
db.users.createIndex({ email: 1 }, { unique: true });
db.bookings.createIndex({ customerId: 1 });
db.bookings.createIndex({ branchId: 1, checkInDate: -1 });
db.rooms.createIndex({ branchId: 1, status: 1 });
db.feedbacks.createIndex({ roomId: 1 });
db.profiles.createIndex({ userId: 1 }, { unique: true });
db.customer_settings.createIndex({ userId: 1 }, { unique: true });
print("✅ Indexes created");

print("\n🎉  Seed complete!");
print("──────────────────────────────────────────────────────");
print("  owner@luxstay.vn              Password@123   OWNER");
print("  manager.hanoi@luxstay.vn      Password@123   MANAGER (Hanoi)");
print("  manager.saigon@luxstay.vn     Password@123   MANAGER (Saigon)");
print("  staff1.hanoi@luxstay.vn       Password@123   STAFF");
print("  alice@example.com             Password@123   CUSTOMER");
print("  bob@example.com               Password@123   CUSTOMER");
print("──────────────────────────────────────────────────────");
