CREATE INDEX IF NOT EXISTS idx_branches_country_city
	ON branches (country, city);

CREATE INDEX IF NOT EXISTS idx_room_types_branch_active
	ON room_types (branch_id, is_active);

CREATE INDEX IF NOT EXISTS idx_room_types_amenities_gin
	ON room_types USING GIN (amenities);

CREATE INDEX IF NOT EXISTS idx_rooms_room_type_status
	ON rooms (room_type_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_room_status_dates
	ON bookings (room_id, status, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_created_desc
	ON bookings (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_branch_status_created
	ON bookings (branch_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_booking_status
	ON payments (booking_id, status);

CREATE INDEX IF NOT EXISTS idx_services_branch_active
	ON services (branch_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS ux_active_booking_per_room
	ON bookings (room_id)
	WHERE status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED');

