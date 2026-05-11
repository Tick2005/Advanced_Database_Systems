-- V15: Seed additional data for Dashboard visualization
-- This script adds more bookings, payments, and pricing requests to make charts look richer.

-- Adding more recent bookings to generate revenue data
INSERT INTO bookings (id, customer_id, room_id, branch_id, check_in_date, check_out_date, adults, children, total_price, status, source_channel, confirmed_at, cancelled_at, created_at)
VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', CURRENT_DATE - INTERVAL '15 day', CURRENT_DATE - INTERVAL '12 day', 2, 0, 4500000, 'CHECKED_OUT', 'WEB', CURRENT_DATE - INTERVAL '20 day', NULL, CURRENT_DATE - INTERVAL '20 day'),
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22', '44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555551', CURRENT_DATE - INTERVAL '10 day', CURRENT_DATE - INTERVAL '8 day', 2, 0, 3200000, 'CHECKED_OUT', 'MOBILE', CURRENT_DATE - INTERVAL '12 day', NULL, CURRENT_DATE - INTERVAL '12 day'),
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', '44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555551', CURRENT_DATE - INTERVAL '5 day', CURRENT_DATE - INTERVAL '2 day', 2, 2, 8500000, 'CHECKED_OUT', 'OTA', CURRENT_DATE - INTERVAL '10 day', NULL, CURRENT_DATE - INTERVAL '10 day'),
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24', '44444444-4444-4444-4444-444444444447', '77777777-7777-7777-7777-777777777774', '55555555-5555-5555-5555-555555555552', CURRENT_DATE - INTERVAL '2 day', CURRENT_DATE + INTERVAL '1 day', 2, 0, 4800000, 'CHECKED_IN', 'WEB', CURRENT_DATE - INTERVAL '5 day', NULL, CURRENT_DATE - INTERVAL '5 day'),
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa25', '44444444-4444-4444-4444-444444444448', '77777777-7777-7777-7777-777777777778', '55555555-5555-5555-5555-555555555552', CURRENT_DATE + INTERVAL '3 day', CURRENT_DATE + INTERVAL '5 day', 1, 0, 3240000, 'CONFIRMED', 'WEB', CURRENT_DATE - INTERVAL '1 day', NULL, CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Adding corresponding payments
INSERT INTO payments (id, booking_id, provider, transaction_ref, amount, currency, status, paid_at, raw_payload)
VALUES
	('cccccccc-cccc-cccc-cccc-ccccccccccc9', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21', 'VNPAY', 'VNPAY-DEMO-TX-0009', 4500000, 'VND', 'SUCCESS', CURRENT_DATE - INTERVAL '15 day', '{"channel":"sandbox"}'::jsonb),
	('cccccccc-cccc-cccc-cccc-cccccccccc10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22', 'VNPAY', 'VNPAY-DEMO-TX-0010', 3200000, 'VND', 'SUCCESS', CURRENT_DATE - INTERVAL '10 day', '{"channel":"sandbox"}'::jsonb),
	('cccccccc-cccc-cccc-cccc-cccccccccc11', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23', 'VNPAY', 'VNPAY-DEMO-TX-0011', 8500000, 'VND', 'SUCCESS', CURRENT_DATE - INTERVAL '5 day', '{"channel":"sandbox"}'::jsonb),
	('cccccccc-cccc-cccc-cccc-cccccccccc12', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24', 'VNPAY', 'VNPAY-DEMO-TX-0012', 4800000, 'VND', 'SUCCESS', CURRENT_DATE - INTERVAL '2 day', '{"channel":"sandbox"}'::jsonb),
	('cccccccc-cccc-cccc-cccc-cccccccccc13', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa25', 'VNPAY', 'VNPAY-DEMO-TX-0013', 3240000, 'VND', 'SUCCESS', CURRENT_DATE - INTERVAL '1 day', '{"channel":"sandbox"}'::jsonb)
ON CONFLICT (booking_id) DO NOTHING;

-- Adding more Pricing Requests
INSERT INTO pricing_requests (id, branch_id, name, starts_on, ends_on, discount_percent, notes, status, requested_by, reviewed_by, review_note, created_at)
VALUES
	('dd000004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555551', 'Flash Sale Weekend', CURRENT_DATE + INTERVAL '5 day', CURRENT_DATE + INTERVAL '7 day', 25.0, 'Weekend special for low occupancy', 'PENDING', '22222222-2222-2222-2222-222222222222', NULL, NULL, CURRENT_DATE - INTERVAL '1 day'),
	('dd000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555552', 'Autumn Promo', CURRENT_DATE + INTERVAL '60 day', CURRENT_DATE + INTERVAL '90 day', 15.0, 'Early bird for autumn', 'APPROVED', '22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Approved for early bird marketing', CURRENT_DATE - INTERVAL '5 day')
ON CONFLICT (id) DO NOTHING;
