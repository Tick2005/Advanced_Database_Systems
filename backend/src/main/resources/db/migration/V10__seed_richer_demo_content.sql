INSERT INTO users (id, email, password_hash, role, is_active, email_verified)
VALUES
  ('44444444-4444-4444-4444-444444444445', 'customer2@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE),
  ('44444444-4444-4444-4444-444444444446', 'customer3@hotel.local', '$2a$10$GxpUpyU8AGCKl67giDcxeuLt2pHv66qqWrTGMx8SvfW8fJB3Gii9i', 'CUSTOMER', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, full_name, phone, preferred_language)
VALUES
  ('44444444-4444-4444-4444-444444444445', 'Tran Minh Anh', '0900000005', 'vi'),
  ('44444444-4444-4444-4444-444444444446', 'Le Gia Huy', '0900000006', 'vi')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO branch_images (id, branch_id, image_url, alt_text, is_cover, sort_order)
VALUES
  ('ba000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555551', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg', 'Da Nang Center facade', TRUE, 1),
  ('ba000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555551', 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg', 'Da Nang lobby', FALSE, 2),
  ('ba000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555552', 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg', 'HCM Riverside facade', TRUE, 1),
  ('ba000004-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555552', 'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg', 'HCM lobby', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_type_images (id, room_type_id, image_url, alt_text, is_cover, sort_order)
VALUES
  ('ab000001-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666661', 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg', 'Deluxe king cover', TRUE, 1),
  ('ab000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666661', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg', 'Deluxe king interior', FALSE, 2),
  ('ab000003-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666662', 'https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg', 'Family suite cover', TRUE, 1),
  ('ab000004-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666662', 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg', 'Family suite bedroom', FALSE, 2),
  ('ab000005-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666663', 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg', 'Business queen cover', TRUE, 1),
  ('ab000006-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666663', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'Business queen interior', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, room_type_id, room_number, floor, status, rate, max_occupancy, notes)
VALUES
  ('77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666661', '803', 8, 'AVAILABLE', 1280000, 2, 'River-facing room'),
  ('77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666662', '1202', 12, 'HELD', 2400000, 4, 'Connected room option'),
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666663', '1503', 15, 'MAINTENANCE', 1480000, 2, 'Refreshing furniture'),
  ('77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666663', '1504', 15, 'AVAILABLE', 1620000, 2, 'Quiet corner unit')
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_images (id, room_id, image_url, alt_text, is_cover, sort_order)
VALUES
  ('ac000001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777771', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg', 'Room 801 cover', TRUE, 1),
  ('ac000002-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777772', 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg', 'Room 802 cover', TRUE, 1),
  ('ac000003-0000-0000-0000-000000000003', '77777777-7777-7777-7777-777777777773', 'https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg', 'Room 1201 cover', TRUE, 1),
  ('ac000004-0000-0000-0000-000000000004', '77777777-7777-7777-7777-777777777774', 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg', 'Room 1502 cover', TRUE, 1),
  ('ac000005-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777775', 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg', 'Room 803 cover', TRUE, 1),
  ('ac000006-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777776', 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg', 'Room 1202 cover', TRUE, 1),
  ('ac000007-0000-0000-0000-000000000007', '77777777-7777-7777-7777-777777777777', 'https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg', 'Room 1503 cover', TRUE, 1),
  ('ac000008-0000-0000-0000-000000000008', '77777777-7777-7777-7777-777777777778', 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg', 'Room 1504 cover', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

UPDATE services
SET thumbnail_url = CASE code
  WHEN 'BF-SET' THEN 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg'
  WHEN 'AIRPORT-PICKUP' THEN 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'
  WHEN 'LAUNDRY-FAST' THEN 'https://images.pexels.com/photos/5591664/pexels-photo-5591664.jpeg'
  ELSE thumbnail_url
END
WHERE code IN ('BF-SET', 'AIRPORT-PICKUP', 'LAUNDRY-FAST');

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
  confirmed_at,
  cancelled_at
)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555551', DATE '2026-05-06', DATE '2026-05-09', 2, 0, 3750000, 'CONFIRMED', 'WEB', NOW(), NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555551', DATE '2026-05-02', DATE '2026-05-05', 2, 2, 7100000, 'CHECKED_OUT', 'WEB', NOW() - INTERVAL '7 day', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777778', '55555555-5555-5555-5555-555555555552', DATE '2026-05-10', DATE '2026-05-12', 1, 0, 3240000, 'PENDING_PAYMENT', 'WEB', NULL, NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777775', '55555555-5555-5555-5555-555555555551', DATE '2026-04-28', DATE '2026-05-01', 2, 0, 3800000, 'CANCELLED', 'WEB', NOW() - INTERVAL '15 day', NOW() - INTERVAL '14 day')
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
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'VNPAY', 'VNPAY-DEMO-TX-0002', 3750000, 'VND', 'SUCCESS', NOW(), '{"channel":"sandbox","status":"success"}'::jsonb),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'VNPAY', 'VNPAY-DEMO-TX-0003', 7100000, 'VND', 'SUCCESS', NOW() - INTERVAL '7 day', '{"channel":"sandbox","status":"success"}'::jsonb),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'VNPAY', 'VNPAY-DEMO-TX-0004', 3240000, 'VND', 'PENDING', NULL, '{"channel":"sandbox","status":"pending"}'::jsonb),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'VNPAY', 'VNPAY-DEMO-TX-0005', 3800000, 'VND', 'FAILED', NULL, '{"channel":"sandbox","status":"failed"}'::jsonb)
ON CONFLICT (booking_id) DO NOTHING;
