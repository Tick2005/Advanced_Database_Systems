-- V7: Demo Seed Data

-- Ensure bookings.rate exists before seeding rows that reference it
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rate >= 0);
CREATE INDEX IF NOT EXISTS idx_bookings_rate ON bookings(rate);
UPDATE bookings b
SET rate = r.rate
FROM rooms r
WHERE b.rate = 0 AND b.room_id = r.id;

-- Demo users (passwords: all are '123456' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, is_active, email_verified)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'owner@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'OWNER', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'manager-hn@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'MANAGER', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222223', 'manager-camau@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'MANAGER', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222224', 'manager-dalat@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'MANAGER', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222225', 'manager-danang@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'MANAGER', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333333', 'staff-hn-1@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333334', 'staff-hn-2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333335', 'staff-camau-1@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333336', 'staff-camau-2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333337', 'staff-dalat-1@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333338', 'staff-dalat-2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333339', 'staff-danang-1@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333340', 'staff-danang-2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'STAFF', TRUE, TRUE),
    ('44444444-4444-4444-4444-444444444444', 'customer@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE),
    ('44444444-4444-4444-4444-444444444445', 'customer2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE),
    ('44444444-4444-4444-4444-444444444446', 'customer3@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE),
    ('44444444-4444-4444-4444-444444444447', 'customer4@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE),
    ('44444444-4444-4444-4444-444444444448', 'customer5@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed customer settings (demo)
INSERT INTO customer_settings (id, user_id, theme, font_scale, allow_location, allow_camera, updated_at, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'light', 'normal', TRUE, TRUE, '2026-04-20T12:00:00Z'::timestamptz, '2026-04-20T12:00:00Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

-- Demo user profiles
INSERT INTO user_profiles (user_id, full_name, phone, preferred_language, avatar_url)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'System Owner', '0900000001', 'vi', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'),
    ('22222222-2222-2222-2222-222222222222', 'Nguyen Van An - Manager Hanoi', '0900000002', 'vi', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg'),
    ('22222222-2222-2222-2222-222222222223', 'Tran Thi Bich - Manager Ca Mau', '0900000007', 'vi', NULL),
    ('22222222-2222-2222-2222-222222222224', 'Hoang Minh C - Manager Da Lat', '0900000012', 'vi', NULL),
    ('22222222-2222-2222-2222-222222222225', 'Le Thi D - Manager Da Nang', '0900000013', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333333', 'Staff Nguyen - Hanoi', '0900000003', 'vi', 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg'),
    ('33333333-3333-3333-3333-333333333334', 'Staff Pham - Hanoi', '0900000008', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333335', 'Staff Le - Ca Mau', '0900000009', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333336', 'Staff Vu - Ca Mau', '0900000014', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333337', 'Staff Dao - Da Lat', '0900000015', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333338', 'Staff Hai - Da Lat', '0900000016', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333339', 'Staff Khanh - Da Nang', '0900000017', 'vi', NULL),
    ('33333333-3333-3333-3333-333333333340', 'Staff Linh - Da Nang', '0900000018', 'vi', NULL),
    ('44444444-4444-4444-4444-444444444444', 'Demo Customer', '0900000004', 'vi', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'),
    ('44444444-4444-4444-4444-444444444445', 'Tran Minh Anh', '0900000005', 'vi', NULL),
    ('44444444-4444-4444-4444-444444444446', 'Le Gia Huy', '0900000006', 'vi', NULL),
    ('44444444-4444-4444-4444-444444444447', 'Nguyen Thi Cam', '0900000010', 'vi', 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg'),
    ('44444444-4444-4444-4444-444444444448', 'Do Thanh Long', '0900000011', 'vi', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg')
ON CONFLICT (user_id) DO NOTHING;

-- Demo branches
INSERT INTO branches (id, code, name, country, city, address, phone, email, timezone, latitude, longitude)
VALUES
    ('55555555-5555-5555-5555-555555555551', 'HN-CENTER', 'Hanoi Central Hotel', 'Vietnam', 'Hanoi', '123 Ly Thai To, Hoan Kiem', '0241234567', 'hn-center@hotel.local', 'Asia/Ho_Chi_Minh', 21.027764, 105.834160),
    ('55555555-5555-5555-5555-555555555552', 'CAM-DELTA', 'Ca Mau Bay Hotel', 'Vietnam', 'Ca Mau', '45 Nguyen Hue, Tan An', '0290301234', 'cam-bay@hotel.local', 'Asia/Ho_Chi_Minh', 9.176703, 105.150271),
    ('55555555-5555-5555-5555-555555555553', 'DAL-MOUNTAIN', 'Da Lat Hills Hotel', 'Vietnam', 'Da Lat', '89 Phan Dinh Phung, Da Lat', '0263378901', 'dal-hills@hotel.local', 'Asia/Ho_Chi_Minh', 11.940398, 108.458313),
    ('55555555-5555-5555-5555-555555555554', 'DN-BEACH', 'Da Nang Beach Hotel', 'Vietnam', 'Da Nang', '26 Vo Nguyen Giap, My Khe', '0236378901', 'dn-beach@hotel.local', 'Asia/Ho_Chi_Minh', 16.056016, 108.203229)
ON CONFLICT (id) DO NOTHING;

-- Demo user-branch assignments
INSERT INTO user_branch_assignments (user_id, branch_id)
VALUES
    ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551'),
    ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555551'),
    ('22222222-2222-2222-2222-222222222223', '55555555-5555-5555-5555-555555555552'),
    ('22222222-2222-2222-2222-222222222224', '55555555-5555-5555-5555-555555555553'),
    ('22222222-2222-2222-2222-222222222225', '55555555-5555-5555-5555-555555555554'),
    ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551'),
    ('33333333-3333-3333-3333-333333333334', '55555555-5555-5555-5555-555555555551'),
    ('33333333-3333-3333-3333-333333333335', '55555555-5555-5555-5555-555555555552'),
    ('33333333-3333-3333-3333-333333333336', '55555555-5555-5555-5555-555555555552'),
    ('33333333-3333-3333-3333-333333333337', '55555555-5555-5555-5555-555555555553'),
    ('33333333-3333-3333-3333-333333333338', '55555555-5555-5555-5555-555555555553'),
    ('33333333-3333-3333-3333-333333333339', '55555555-5555-5555-5555-555555555554'),
    ('33333333-3333-3333-3333-333333333340', '55555555-5555-5555-5555-555555555554')
ON CONFLICT (user_id) DO UPDATE SET branch_id = EXCLUDED.branch_id, updated_at = NOW();

-- Demo room types (3 categories per branch)
INSERT INTO room_types (id, branch_id, code, name, slug, description, base_price, capacity, bed_type, amenities, average_rating, review_count, is_featured, is_active)
VALUES
    ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'HN-STD', 'Standard Room', 'standard-room', 'Cozy standard room with city view', 900000, 2, 'QUEEN', '[]'::jsonb, 4.1, 26, FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', 'HN-DELUXE', 'Deluxe Room', 'deluxe-room', 'Spacious deluxe room with balcony', 1400000, 2, 'KING', '[]'::jsonb, 4.6, 44, TRUE, TRUE),
    ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555551', 'HN-FAMILY', 'Family Room', 'family-room', 'Family room for up to 4 guests', 2100000, 4, 'DOUBLE + SINGLE', '[]'::jsonb, 4.8, 31, TRUE, TRUE),
    ('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555552', 'CAM-STD', 'Standard Room', 'standard-room', 'Comfortable room near the river', 750000, 2, 'QUEEN', '[]'::jsonb, 4.2, 18, FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666665', '55555555-5555-5555-5555-555555555552', 'CAM-DELUXE', 'Deluxe Room', 'deluxe-room', 'Modern deluxe room with garden view', 1150000, 2, 'KING', '[]'::jsonb, 4.5, 21, TRUE, TRUE),
    ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555552', 'CAM-FAMILY', 'Family Room', 'family-room', 'Spacious family room with connected beds', 1850000, 4, 'DOUBLE + SINGLE', '[]'::jsonb, 4.7, 12, FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666667', '55555555-5555-5555-5555-555555555553', 'DAL-STD', 'Standard Room', 'standard-room', 'Warm standard room with countryside view', 820000, 2, 'QUEEN', '[]'::jsonb, 4.3, 19, FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666668', '55555555-5555-5555-5555-555555555553', 'DAL-DELUXE', 'Deluxe Room', 'deluxe-room', 'Elegant room with balcony and fire heater', 1300000, 2, 'KING', '[]'::jsonb, 4.6, 28, TRUE, TRUE),
    ('66666666-6666-6666-6666-666666666669', '55555555-5555-5555-5555-555555555553', 'DAL-FAMILY', 'Family Room', 'family-room', 'Large family room for friends and kids', 2000000, 4, 'DOUBLE + SINGLE', '[]'::jsonb, 4.5, 15, FALSE, TRUE),
    ('66666666-6666-6666-6666-66666666666a', '55555555-5555-5555-5555-555555555554', 'DN-STD', 'Standard Room', 'standard-room', 'Bright standard room near the beach', 980000, 2, 'QUEEN', '[]'::jsonb, 4.4, 22, FALSE, TRUE),
    ('66666666-6666-6666-6666-66666666666b', '55555555-5555-5555-5555-555555555554', 'DN-DELUXE', 'Deluxe Room', 'deluxe-room', 'Premium room with sea breeze', 1450000, 2, 'KING', '[]'::jsonb, 4.7, 35, TRUE, TRUE),
    ('66666666-6666-6666-6666-66666666666c', '55555555-5555-5555-5555-555555555554', 'DN-FAMILY', 'Family Room', 'family-room', 'Family suite with extra sofa bed', 2100000, 4, 'DOUBLE + SINGLE', '[]'::jsonb, 4.8, 27, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Demo rooms (6 rooms per branch = 24 total)
INSERT INTO rooms (id, room_type_id, room_number, floor, status, rate, max_occupancy, notes)
VALUES
    -- ── Hanoi Central Hotel (6 phòng) ──────────────────────────────────────
    ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', '101', 1, 'AVAILABLE', 900000,  2, 'Near reception'),
    ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666662', '102', 1, 'AVAILABLE', 1400000, 2, 'City-view balcony'),
    ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666663', '201', 2, 'AVAILABLE', 2100000, 4, 'Family-friendly layout'),
    ('77777777-7777-7777-7777-7777777777d1', '66666666-6666-6666-6666-666666666661', '103', 1, 'AVAILABLE', 900000,  2, 'Standard quiet room'),
    ('77777777-7777-7777-7777-7777777777d2', '66666666-6666-6666-6666-666666666662', '202', 2, 'AVAILABLE', 1400000, 2, 'Deluxe with lake view'),
    ('77777777-7777-7777-7777-7777777777d3', '66666666-6666-6666-6666-666666666663', '301', 3, 'AVAILABLE', 2100000, 4, 'Large family suite top floor'),

    -- ── Ca Mau Bay Hotel (6 phòng) ──────────────────────────────────────────
    ('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666664', '301', 3, 'AVAILABLE', 750000,  2, 'Ground-floor river view'),
    ('77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666665', '302', 3, 'AVAILABLE', 1150000, 2, 'Corner room with garden'),
    ('77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666666', '401', 4, 'AVAILABLE', 1850000, 4, 'Large family suite'),
    ('77777777-7777-7777-7777-7777777777e1', '66666666-6666-6666-6666-666666666664', '303', 3, 'AVAILABLE', 750000,  2, 'Standard mangrove view'),
    ('77777777-7777-7777-7777-7777777777e2', '66666666-6666-6666-6666-666666666665', '402', 4, 'AVAILABLE', 1150000, 2, 'Deluxe with delta panorama'),
    ('77777777-7777-7777-7777-7777777777e3', '66666666-6666-6666-6666-666666666666', '501', 5, 'AVAILABLE', 1850000, 4, 'Family suite river side'),

    -- ── Da Lat Hills Hotel (6 phòng) ────────────────────────────────────────
    ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666667', '105', 1, 'AVAILABLE', 820000,  2, 'Cosy countryside style'),
    ('77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666668', '106', 1, 'AVAILABLE', 1300000, 2, 'Balcony with heater'),
    ('77777777-7777-7777-7777-777777777779', '66666666-6666-6666-6666-666666666669', '206', 2, 'AVAILABLE', 2000000, 4, 'Spacious family suite'),
    ('77777777-7777-7777-7777-7777777777f1', '66666666-6666-6666-6666-666666666667', '107', 1, 'AVAILABLE', 820000,  2, 'Standard pine forest view'),
    ('77777777-7777-7777-7777-7777777777f2', '66666666-6666-6666-6666-666666666668', '207', 2, 'AVAILABLE', 1300000, 2, 'Deluxe with fireplace'),
    ('77777777-7777-7777-7777-7777777777f3', '66666666-6666-6666-6666-666666666669', '307', 3, 'AVAILABLE', 2000000, 4, 'Family suite mountain view'),

    -- ── Da Nang Beach Hotel (6 phòng) ───────────────────────────────────────
    ('77777777-7777-7777-7777-77777777777a', '66666666-6666-6666-6666-66666666666a', '501', 5, 'AVAILABLE', 980000,  2, 'Beach-view standard'),
    ('77777777-7777-7777-7777-77777777777b', '66666666-6666-6666-6666-66666666666b', '502', 5, 'AVAILABLE', 1450000, 2, 'Sea breeze deluxe'),
    ('77777777-7777-7777-7777-77777777777c', '66666666-6666-6666-6666-66666666666c', '602', 6, 'AVAILABLE', 2100000, 4, 'Family suite with sofa bed'),
    ('77777777-7777-7777-7777-77777777b001', '66666666-6666-6666-6666-66666666666a', '503', 5, 'AVAILABLE', 980000,  2, 'Standard ocean front'),
    ('77777777-7777-7777-7777-77777777b002', '66666666-6666-6666-6666-66666666666b', '601', 6, 'AVAILABLE', 1450000, 2, 'Deluxe sunset view'),
    ('77777777-7777-7777-7777-77777777b003', '66666666-6666-6666-6666-66666666666c', '603', 6, 'AVAILABLE', 2100000, 4, 'Family suite beachfront')
ON CONFLICT (id) DO NOTHING;

-- Demo services — 5 per branch (20 total)
-- Mode distribution: 5×BOTH + 10×ON_SITE + 5×PREBOOK across all 4 branches
--   HN  : 2 BOTH + 2 ON_SITE + 1 PREBOOK
--   CAM : 1 BOTH + 3 ON_SITE + 1 PREBOOK
--   DAL : 1 BOTH + 3 ON_SITE + 1 PREBOOK
--   DN  : 1 BOTH + 2 ON_SITE + 2 PREBOOK
INSERT INTO services (id, branch_id, code, name, description, price, service_mode, is_active, thumbnail_url)
VALUES
    -- ── Hanoi Central Hotel (5 services: 2 BOTH + 2 ON_SITE + 1 PREBOOK) ──
    ('88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555551', 'HN-SPA',       'Spa Relax',          'Two-hour spa package with aromatherapy',              550000, 'BOTH',    TRUE, 'https://images.pexels.com/photos/3588235/pexels-photo-3588235.jpeg'),
    ('88888888-8888-8888-8888-888888888885', '55555555-5555-5555-5555-555555555551', 'HN-BREAKFAST', 'Breakfast Buffet',   'All-you-can-eat breakfast buffet',                    220000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/302680/pexels-photo-302680.jpeg'),
    ('88888888-8888-8888-8888-8888888888a1', '55555555-5555-5555-5555-555555555551', 'HN-AIRPORT',   'Airport Transfer',   'Round-trip airport shuttle service',                  350000, 'PREBOOK', TRUE, 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg'),
    ('88888888-8888-8888-8888-8888888888a2', '55555555-5555-5555-5555-555555555551', 'HN-LAUNDRY',   'Laundry Service',    'Same-day laundry and ironing service',                150000, 'BOTH',    TRUE, 'https://images.pexels.com/photos/5591581/pexels-photo-5591581.jpeg'),
    ('88888888-8888-8888-8888-8888888888a3', '55555555-5555-5555-5555-555555555551', 'HN-CITYTOUR',  'Hanoi City Tour',    'Half-day guided tour of Hoan Kiem and Old Quarter',   480000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/2412603/pexels-photo-2412603.jpeg'),

    -- ── Ca Mau Bay Hotel (5 services: 1 BOTH + 3 ON_SITE + 1 PREBOOK) ────
    ('88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555552', 'CAM-TOUR',     'Delta Boat Tour',    'Guided boat tour through the Mekong Delta',           450000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/165575/pexels-photo-165575.jpeg'),
    ('88888888-8888-8888-8888-8888888888b1', '55555555-5555-5555-5555-555555555552', 'CAM-FISHING',  'Fishing Trip',       'Early-morning fishing on the Ca Mau river',           320000, 'PREBOOK', TRUE, 'https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg'),
    ('88888888-8888-8888-8888-8888888888b2', '55555555-5555-5555-5555-555555555552', 'CAM-MANGROVE', 'Mangrove Kayak',     'Kayaking through the mangrove forest reserve',        380000, 'BOTH',    TRUE, 'https://images.pexels.com/photos/1430672/pexels-photo-1430672.jpeg'),
    ('88888888-8888-8888-8888-8888888888b3', '55555555-5555-5555-5555-555555555552', 'CAM-SEAFOOD',  'Seafood Dinner',     'Fresh seafood dinner with local specialties',         520000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg'),
    ('88888888-8888-8888-8888-8888888888b4', '55555555-5555-5555-5555-555555555552', 'CAM-BIKE',     'Bicycle Rental',     'Full-day bicycle rental to explore the delta',        120000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg'),

    -- ── Da Lat Hills Hotel (5 services: 1 BOTH + 3 ON_SITE + 1 PREBOOK) ──
    ('88888888-8888-8888-8888-888888888883', '55555555-5555-5555-5555-555555555553', 'DAL-DINNER',   'Highland Dinner',    'Local cuisine dinner in the mountain lodge',          620000, 'PREBOOK', TRUE, 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg'),
    ('88888888-8888-8888-8888-8888888888c1', '55555555-5555-5555-5555-555555555553', 'DAL-FLOWER',   'Flower Garden Tour', 'Guided tour of Da Lat flower gardens and greenhouses', 280000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg'),
    ('88888888-8888-8888-8888-8888888888c2', '55555555-5555-5555-5555-555555555553', 'DAL-TREKKING', 'Pine Forest Trek',   'Half-day trekking through pine forests',              350000, 'BOTH',    TRUE, 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg'),
    ('88888888-8888-8888-8888-8888888888c3', '55555555-5555-5555-5555-555555555553', 'DAL-COFFEE',   'Coffee Plantation',  'Visit and tasting at a local coffee plantation',      200000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg'),
    ('88888888-8888-8888-8888-8888888888c4', '55555555-5555-5555-5555-555555555553', 'DAL-FIREPLACE','Fireplace Package',  'Evening fireplace setup with hot drinks and snacks',  180000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg'),

    -- ── Da Nang Beach Hotel (5 services: 1 BOTH + 2 ON_SITE + 2 PREBOOK) ─
    ('88888888-8888-8888-8888-888888888884', '55555555-5555-5555-5555-555555555554', 'DN-GYM',       'Gym Access',         '24/7 fitness center with trainer support',            280000, 'BOTH',    TRUE, 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg'),
    ('88888888-8888-8888-8888-8888888888d1', '55555555-5555-5555-5555-555555555554', 'DN-SURFING',   'Surfing Lesson',     'Beginner surfing lesson on My Khe beach',             450000, 'PREBOOK', TRUE, 'https://images.pexels.com/photos/390051/pexels-photo-390051.jpeg'),
    ('88888888-8888-8888-8888-8888888888d2', '55555555-5555-5555-5555-555555555554', 'DN-SNORKEL',   'Snorkeling Trip',    'Half-day snorkeling at Cham Island',                  550000, 'PREBOOK', TRUE, 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg'),
    ('88888888-8888-8888-8888-8888888888d3', '55555555-5555-5555-5555-555555555554', 'DN-BEACHBAR',  'Beach Bar Package',  'Sunset drinks and snacks at the private beach bar',   320000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg'),
    ('88888888-8888-8888-8888-8888888888d4', '55555555-5555-5555-5555-555555555554', 'DN-MASSAGE',   'Beach Massage',      'Relaxing 60-minute massage by the sea',               420000, 'ON_SITE', TRUE, 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg')
ON CONFLICT (id) DO NOTHING;

-- Demo branch images
INSERT INTO branch_images (id, branch_id, image_url, alt_text, is_cover, sort_order)
VALUES
    ('ba000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555551', 'https://images.pexels.com/photos/3807688/pexels-photo-3807688.jpeg', 'Hanoi Central facade', TRUE, 1),
    ('ba000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555552', 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg', 'Ca Mau river view', TRUE, 1),
    ('ba000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555553', 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg', 'Da Lat hillside hotel', TRUE, 1),
    ('ba000004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555554', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg', 'Da Nang beach hotel view', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROOM IMAGES: Professional photos for all 24 rooms
-- ============================================================================
INSERT INTO room_images (id, room_id, image_url, alt_text, is_cover, sort_order)
VALUES
    -- Hanoi (6 phòng)
    ('cc000001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777771', 'https://images.pexels.com/photos/279711/pexels-photo-279711.jpeg',  'Hanoi Standard 101',      TRUE, 1),
    ('cc000002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777772', 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg', 'Hanoi Deluxe 102',        TRUE, 1),
    ('cc000003-0000-0000-0000-000000000003', '77777777-7777-7777-7777-777777777773', 'https://images.pexels.com/photos/280235/pexels-photo-280235.jpeg',  'Hanoi Family 201',        TRUE, 1),
    ('cc000013-0000-0000-0000-000000000013', '77777777-7777-7777-7777-7777777777d1', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',  'Hanoi Standard 103',      TRUE, 1),
    ('cc000014-0000-0000-0000-000000000014', '77777777-7777-7777-7777-7777777777d2', 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',  'Hanoi Deluxe 202',        TRUE, 1),
    ('cc000015-0000-0000-0000-000000000015', '77777777-7777-7777-7777-7777777777d3', 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',  'Hanoi Family 301',        TRUE, 1),
    -- Ca Mau (6 phòng)
    ('cc000004-0000-0000-0000-000000000004', '77777777-7777-7777-7777-777777777774', 'https://images.pexels.com/photos/67636/pexels-photo-67636.jpeg',    'Ca Mau Standard 301',     TRUE, 1),
    ('cc000005-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777775', 'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg',  'Ca Mau Deluxe 302',       TRUE, 1),
    ('cc000006-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777776', 'https://images.pexels.com/photos/1882249/pexels-photo-1882249.jpeg','Ca Mau Family 401',       TRUE, 1),
    ('cc000016-0000-0000-0000-000000000016', '77777777-7777-7777-7777-7777777777e1', 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg',  'Ca Mau Standard 303',     TRUE, 1),
    ('cc000017-0000-0000-0000-000000000017', '77777777-7777-7777-7777-7777777777e2', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg',  'Ca Mau Deluxe 402',       TRUE, 1),
    ('cc000018-0000-0000-0000-000000000018', '77777777-7777-7777-7777-7777777777e3', 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg','Ca Mau Family 501',       TRUE, 1),
    -- Da Lat (6 phòng)
    ('cc000007-0000-0000-0000-000000000007', '77777777-7777-7777-7777-777777777777', 'https://images.pexels.com/photos/1619311/pexels-photo-1619311.jpeg','Da Lat Standard 105',     TRUE, 1),
    ('cc000008-0000-0000-0000-000000000008', '77777777-7777-7777-7777-777777777778', 'https://images.pexels.com/photos/244006/pexels-photo-244006.jpeg',  'Da Lat Deluxe 106',       TRUE, 1),
    ('cc000009-0000-0000-0000-000000000009', '77777777-7777-7777-7777-777777777779', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',  'Da Lat Family 206',       TRUE, 1),
    ('cc000019-0000-0000-0000-000000000019', '77777777-7777-7777-7777-7777777777f1', 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',  'Da Lat Standard 107',     TRUE, 1),
    ('cc000020-0000-0000-0000-000000000020', '77777777-7777-7777-7777-7777777777f2', 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg','Da Lat Deluxe 207',       TRUE, 1),
    ('cc000021-0000-0000-0000-000000000021', '77777777-7777-7777-7777-7777777777f3', 'https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg',  'Da Lat Family 307',       TRUE, 1),
    -- Da Nang (6 phòng)
    ('cc000010-0000-0000-0000-000000000010', '77777777-7777-7777-7777-77777777777a', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',  'Da Nang Standard 501',    TRUE, 1),
    ('cc000011-0000-0000-0000-000000000011', '77777777-7777-7777-7777-77777777777b', 'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg',  'Da Nang Deluxe 502',      TRUE, 1),
    ('cc000012-0000-0000-0000-000000000012', '77777777-7777-7777-7777-77777777777c', 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg',  'Da Nang Family 602',      TRUE, 1),
    ('cc000022-0000-0000-0000-000000000022', '77777777-7777-7777-7777-77777777b001', 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg',  'Da Nang Standard 503',    TRUE, 1),
    ('cc000023-0000-0000-0000-000000000023', '77777777-7777-7777-7777-77777777b002', 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg','Da Nang Deluxe 601',      TRUE, 1),
    ('cc000024-0000-0000-0000-000000000024', '77777777-7777-7777-7777-77777777b003', 'https://images.pexels.com/photos/280235/pexels-photo-280235.jpeg',  'Da Nang Family 603',      TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BOOKINGS: Real bookings spanning multiple statuses to populate dashboards
-- ============================================================================

INSERT INTO bookings (id, customer_id, room_id, branch_id, check_in_date, check_out_date, adults, children, total_price, status, rate, created_at, updated_at)
VALUES
    ('aa000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day', 2, 0, 900000, 'CHECKED_OUT', 900000, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('aa000002-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555551', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 2, 1, 2800000, 'CHECKED_IN', 1400000, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('aa000003-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777775', '55555555-5555-5555-5555-555555555552', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 2, 0, 2300000, 'CHECKED_IN', 1150000, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('aa000004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444447', '77777777-7777-7777-7777-777777777778', '55555555-5555-5555-5555-555555555553', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 2, 0, 2600000, 'CHECKED_IN', 1300000, CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('aa000005-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444448', '77777777-7777-7777-7777-77777777777a', '55555555-5555-5555-5555-555555555554', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 2, 0, 1960000, 'PENDING_PAYMENT', 980000, CURRENT_TIMESTAMP - INTERVAL '5 minutes', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('aa000006-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-77777777777a', '55555555-5555-5555-5555-555555555554', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '9 days', 2, 0, 1960000, 'HOLD', 980000, CURRENT_TIMESTAMP - INTERVAL '3 minutes', CURRENT_TIMESTAMP - INTERVAL '3 minutes'),
    ('aa000007-0000-0000-0000-000000000007', '44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777779', '55555555-5555-5555-5555-555555555553', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '17 days', 3, 1, 6000000, 'CONFIRMED', 2000000, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('aa000008-0000-0000-0000-000000000008', '44444444-4444-4444-4444-444444444448', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days', 2, 0, 900000, 'CANCELLED', 900000, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BOOKING_SERVICES: Services added to active checked-in bookings
-- ============================================================================
INSERT INTO booking_services (id, booking_id, service_id, quantity, actual_price, created_at, updated_at)
VALUES
    ('bb000001-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888881', 1, 550000, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('bb000002-0000-0000-0000-000000000002', 'aa000003-0000-0000-0000-000000000003', '88888888-8888-8888-8888-888888888882', 1, 450000, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('bb000003-0000-0000-0000-000000000003', 'aa000004-0000-0000-0000-000000000004', '88888888-8888-8888-8888-888888888883', 1, 620000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bb000004-0000-0000-0000-000000000004', 'aa000002-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888885', 2, 440000, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PAYMENTS: Transaction records for bookings
-- ============================================================================
INSERT INTO payments (id, booking_id, provider, transaction_ref, amount, currency, status, paid_at, created_at, updated_at)
VALUES
    ('ff000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'VNPAY', 'VNP20260516001', 900000, 'VND', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('ff000002-0000-0000-0000-000000000002', 'aa000002-0000-0000-0000-000000000002', 'VNPAY', 'VNP20260516002', 1400000, 'VND', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
    ('ff000003-0000-0000-0000-000000000003', 'aa000003-0000-0000-0000-000000000003', 'BANK_TRANSFER', 'BT20260516003', 1150000, 'VND', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('ff000004-0000-0000-0000-000000000004', 'aa000004-0000-0000-0000-000000000004', 'VNPAY', 'VNP20260516004', 1300000, 'VND', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
    ('ff000005-0000-0000-0000-000000000005', 'aa000005-0000-0000-0000-000000000005', 'VNPAY', 'VNP20260516005', 980000, 'VND', 'PENDING', NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    ('ff000006-0000-0000-0000-000000000006', 'aa000007-0000-0000-0000-000000000007', 'BANK_TRANSFER', 'BT20260516006', 2000000, 'VND', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PRICING_REQUESTS: Manager requests for temporary price adjustment
-- discount_percent > 0 → giảm giá (kích cầu khi ít khách)
-- discount_percent < 0 → tăng giá (surcharge khi đông khách / mặt bằng cao)
-- starts_on / ends_on: khoảng thời gian áp dụng (tạm thời, không vĩnh viễn)
-- ============================================================================
INSERT INTO pricing_requests (id, branch_id, name, starts_on, ends_on, discount_percent, reason, status, requested_by, created_at, updated_at)
VALUES
    -- Hà Nội đông khách dịp hè, muốn tăng giá 10% (discount âm = surcharge)
    ('dd000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555551',
     'Surcharge hè 2026 - Hà Nội',
     CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '80 days',
     -10,
     'Tỷ lệ lấp đầy tháng 6-8 đạt 92%, nhu cầu cao hơn nguồn cung. Đề xuất tăng 10% để tối ưu doanh thu.',
     'PENDING', '22222222-2222-2222-2222-222222222222',
     CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

    -- Đà Lạt ít khách mùa mưa, muốn giảm giá 15% để kích cầu
    ('dd000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555553',
     'Kích cầu mùa mưa - Đà Lạt',
     CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '65 days',
     15,
     'Tỷ lệ lấp đầy tháng 9-11 chỉ đạt 38%, thấp hơn cùng kỳ năm ngoái. Đề xuất giảm 15% để cạnh tranh.',
     'APPROVED', '22222222-2222-2222-2222-222222222224',
     CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),

    -- Đà Nẵng muốn tăng giá do mặt bằng giá thị trường tăng
    ('dd000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555554',
     'Điều chỉnh theo mặt bằng thị trường - Đà Nẵng',
     CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '75 days',
     -20,
     'Các khách sạn cùng phân khúc tại Mỹ Khê đã tăng giá 15-25%. Đề xuất tăng 20% để duy trì vị thế cạnh tranh.',
     'REJECTED', '22222222-2222-2222-2222-222222222225',
     CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PRICING_SEASONS: Demo seasonal pricing (multi-branch, multi-room-type)
-- branch_ids = {} → áp dụng tất cả chi nhánh
-- room_type_ids = {} → áp dụng tất cả loại phòng
-- ============================================================================
INSERT INTO pricing_seasons (id, branch_ids, room_type_ids, name, starts_on, ends_on, discount_percent, notes, is_active)
VALUES
    -- Tết Nguyên Đán: tăng giá 20% toàn hệ thống, tất cả loại phòng
    ('ee000001-0000-0000-0000-000000000001',
     '{}',
     '{}',
     'Tết Nguyên Đán 2026',
     '2026-01-25', '2026-02-05',
     -20,
     'Tăng giá 20% dịp Tết Nguyên Đán toàn hệ thống',
     FALSE),

    -- Hè rực rỡ: giảm 15% cho 2 chi nhánh biển (Đà Nẵng + Cà Mau), tất cả loại phòng
    ('ee000002-0000-0000-0000-000000000002',
     ARRAY['55555555-5555-5555-5555-555555555554', '55555555-5555-5555-5555-555555555552']::UUID[],
     '{}',
     'Hè Rực Rỡ 2026',
     '2026-06-01', '2026-08-31',
     15,
     'Giảm 15% cho chi nhánh biển dịp hè',
     FALSE),

    -- Lễ 30/4 - 1/5: giảm 10% toàn hệ thống, chỉ phòng Standard và Deluxe
    ('ee000003-0000-0000-0000-000000000003',
     '{}',
     ARRAY[
       '66666666-6666-6666-6666-666666666661',
       '66666666-6666-6666-6666-666666666662',
       '66666666-6666-6666-6666-666666666664',
       '66666666-6666-6666-6666-666666666665',
       '66666666-6666-6666-6666-666666666667',
       '66666666-6666-6666-6666-666666666668',
       '66666666-6666-6666-6666-66666666666a',
       '66666666-6666-6666-6666-66666666666b'
     ]::UUID[],
     'Lễ 30/4 - 1/5 2026',
     '2026-04-28', '2026-05-02',
     10,
     'Giảm 10% phòng Standard và Deluxe dịp lễ 30/4',
     FALSE)
ON CONFLICT (id) DO NOTHING;
