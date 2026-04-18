INSERT INTO users (id, email, password_hash, role, is_active, email_verified)
VALUES
	('11111111-1111-1111-1111-111111111111', 'owner@hotel.local', '$2a$10$placeholder.owner.hash', 'OWNER', TRUE, TRUE),
	('22222222-2222-2222-2222-222222222222', 'manager@hotel.local', '$2a$10$placeholder.manager.hash', 'MANAGER', TRUE, TRUE),
	('33333333-3333-3333-3333-333333333333', 'staff@hotel.local', '$2a$10$placeholder.staff.hash', 'STAFF', TRUE, TRUE),
	('44444444-4444-4444-4444-444444444444', 'customer@hotel.local', '$2a$10$placeholder.customer.hash', 'CUSTOMER', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, full_name, phone, preferred_language)
VALUES
	('11111111-1111-1111-1111-111111111111', 'System Owner', '0900000001', 'vi'),
	('22222222-2222-2222-2222-222222222222', 'Branch Manager', '0900000002', 'vi'),
	('33333333-3333-3333-3333-333333333333', 'Frontdesk Staff', '0900000003', 'vi'),
	('44444444-4444-4444-4444-444444444444', 'Demo Customer', '0900000004', 'vi')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO branches (id, code, name, country, city, address, phone, email, timezone)
VALUES
	('55555555-5555-5555-5555-555555555551', 'DN-CENTER', 'Da Nang Center Hotel', 'Vietnam', 'Da Nang', '01 Tran Phu, Hai Chau', '0236123456', 'dn-center@hotel.local', 'Asia/Ho_Chi_Minh'),
	('55555555-5555-5555-5555-555555555552', 'HCM-RIVER', 'HCM Riverside Hotel', 'Vietnam', 'Ho Chi Minh', '99 Ton Duc Thang, District 1', '0281234567', 'hcm-river@hotel.local', 'Asia/Ho_Chi_Minh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_types (
	id,
	branch_id,
	code,
	name,
	slug,
	description,
	base_price,
	capacity,
	bed_type,
	amenities,
	average_rating,
	review_count,
	is_featured,
	is_active
)
VALUES
	(
		'66666666-6666-6666-6666-666666666661',
		'55555555-5555-5555-5555-555555555551',
		'DELUXE-KING',
		'Deluxe King',
		'deluxe-king',
		'City view deluxe room with king bed',
		1200000,
		2,
		'KING',
		'["wifi", "breakfast", "smart-tv", "bathtub"]'::jsonb,
		4.6,
		125,
		TRUE,
		TRUE
	),
	(
		'66666666-6666-6666-6666-666666666662',
		'55555555-5555-5555-5555-555555555551',
		'FAMILY-SUITE',
		'Family Suite',
		'family-suite',
		'Large suite for family',
		2200000,
		4,
		'DOUBLE + SINGLE',
		'["wifi", "breakfast", "kitchenette", "living-room"]'::jsonb,
		4.8,
		72,
		TRUE,
		TRUE
	),
	(
		'66666666-6666-6666-6666-666666666663',
		'55555555-5555-5555-5555-555555555552',
		'BUSINESS-QUEEN',
		'Business Queen',
		'business-queen',
		'Quiet business room',
		1500000,
		2,
		'QUEEN',
		'["wifi", "workspace", "espresso-machine"]'::jsonb,
		4.4,
		64,
		FALSE,
		TRUE
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, room_type_id, room_number, floor, status, rate, max_occupancy, notes)
VALUES
	('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', '801', 8, 'AVAILABLE', 1200000, 2, 'Near elevator'),
	('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666661', '802', 8, 'AVAILABLE', 1250000, 2, 'Corner room'),
	('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666662', '1201', 12, 'AVAILABLE', 2300000, 4, 'Family wing'),
	('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666663', '1502', 15, 'AVAILABLE', 1550000, 2, 'High floor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, branch_id, code, name, description, price, service_mode, is_active)
VALUES
	('88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555551', 'BF-SET', 'Breakfast Set', 'Daily breakfast combo', 150000, 'PREBOOK', TRUE),
	('88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555551', 'AIRPORT-PICKUP', 'Airport Pickup', 'Pickup from airport', 350000, 'PREBOOK', TRUE),
	('88888888-8888-8888-8888-888888888883', '55555555-5555-5555-5555-555555555552', 'LAUNDRY-FAST', 'Express Laundry', 'Same-day laundry', 120000, 'ON_SITE', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pricing_seasons (id, branch_id, name, starts_on, ends_on, discount_percent, notes, is_active)
VALUES
	('99999999-9999-9999-9999-999999999991', '55555555-5555-5555-5555-555555555551', 'Summer 2026', DATE '2026-05-01', DATE '2026-08-31', 10.0, 'Summer promo', TRUE),
	('99999999-9999-9999-9999-999999999992', '55555555-5555-5555-5555-555555555552', 'Golden Week', DATE '2026-09-01', DATE '2026-09-10', -15.0, 'Peak adjustment', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (
	id,
	customer_id,
	room_id,
	branch_id,
	check_in_date,
	check_out_date,
	adults,
	children,
	total_price,
	status,
	source_channel,
	confirmed_at
)
VALUES
	(
		'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
		'44444444-4444-4444-4444-444444444444',
		'77777777-7777-7777-7777-777777777771',
		'55555555-5555-5555-5555-555555555551',
		DATE '2026-04-20',
		DATE '2026-04-22',
		2,
		0,
		2550000,
		'CONFIRMED',
		'WEB',
		NOW()
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_services (id, booking_id, service_id, quantity, actual_price)
VALUES
	(
		'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
		'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
		'88888888-8888-8888-8888-888888888881',
		1,
		150000
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (
	id,
	booking_id,
	provider,
	transaction_ref,
	amount,
	currency,
	status,
	paid_at,
	raw_payload
)
VALUES
	(
		'cccccccc-cccc-cccc-cccc-ccccccccccc1',
		'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
		'VNPAY',
		'VNPAY-DEMO-TX-0001',
		2550000,
		'VND',
		'SUCCESS',
		NOW(),
		'{"channel": "sandbox", "status": "success"}'::jsonb
	)
ON CONFLICT (booking_id) DO NOTHING;

UPDATE rooms
SET status = 'OCCUPIED', current_booking_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
WHERE id = '77777777-7777-7777-7777-777777777771';

