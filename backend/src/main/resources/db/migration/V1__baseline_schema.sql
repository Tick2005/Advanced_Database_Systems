-- V1: Baseline Schema - Core tables for hotel management system

-- Users and Profiles
CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	role user_role NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	email_verified BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	full_name VARCHAR(255),
	phone VARCHAR(32),
	avatar_url TEXT,
	address TEXT,
	preferred_language VARCHAR(10),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_settings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	theme VARCHAR(32) NOT NULL DEFAULT 'light',
	font_scale VARCHAR(32) NOT NULL DEFAULT 'normal',
	allow_location BOOLEAN NOT NULL DEFAULT FALSE,
	allow_camera BOOLEAN NOT NULL DEFAULT FALSE,
	location_permission_shown BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ux_customer_settings_user_id UNIQUE (user_id)
);

-- Branches and Locations
CREATE TABLE IF NOT EXISTS branches (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	parent_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
	code VARCHAR(64) NOT NULL UNIQUE,
	name VARCHAR(255) NOT NULL,
	country VARCHAR(128) NOT NULL,
	city VARCHAR(128) NOT NULL,
	address TEXT NOT NULL,
	phone VARCHAR(32),
	email VARCHAR(255),
	timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
	latitude DOUBLE PRECISION,
	longitude DOUBLE PRECISION,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_images (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL,
	alt_text VARCHAR(255),
	is_cover BOOLEAN NOT NULL DEFAULT FALSE,
	sort_order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_branch_assignments (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Room Types and Management
CREATE TABLE IF NOT EXISTS room_types (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	code VARCHAR(64) NOT NULL,
	name VARCHAR(255) NOT NULL,
	slug VARCHAR(255) NOT NULL,
	description TEXT,
	base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
	capacity INT NOT NULL CHECK (capacity > 0),
	bed_type VARCHAR(128),
	amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
	average_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
	review_count INT NOT NULL DEFAULT 0,
	revenue_cached NUMERIC(14, 2) NOT NULL DEFAULT 0,
	is_featured BOOLEAN NOT NULL DEFAULT FALSE,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ux_room_type_branch_code UNIQUE (branch_id, code),
	CONSTRAINT ux_room_type_branch_slug UNIQUE (branch_id, slug)
);

CREATE TABLE IF NOT EXISTS room_type_images (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL,
	alt_text VARCHAR(255),
	is_cover BOOLEAN NOT NULL DEFAULT FALSE,
	sort_order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
	room_number VARCHAR(32) NOT NULL,
	floor INT,
	status room_status NOT NULL DEFAULT 'AVAILABLE',
	rate NUMERIC(12, 2) NOT NULL CHECK (rate >= 0),
	max_occupancy INT NOT NULL CHECK (max_occupancy > 0),
	current_booking_id UUID,
	notes TEXT,
	average_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ux_room_type_room_number UNIQUE (room_type_id, room_number)
);

CREATE TABLE IF NOT EXISTS room_images (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL,
	alt_text VARCHAR(255),
	is_cover BOOLEAN NOT NULL DEFAULT FALSE,
	sort_order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	code VARCHAR(64) NOT NULL,
	name VARCHAR(255) NOT NULL,
	description TEXT,
	thumbnail_url TEXT,
	price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
	service_mode service_mode NOT NULL DEFAULT 'BOTH',
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ux_service_branch_code UNIQUE (branch_id, code)
);

CREATE TABLE IF NOT EXISTS service_images (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL,
	alt_text VARCHAR(255),
	is_cover BOOLEAN NOT NULL DEFAULT FALSE,
	sort_order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings and Payments
CREATE TABLE IF NOT EXISTS bookings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
	check_in_date DATE NOT NULL,
	check_out_date DATE NOT NULL,
	adults INT NOT NULL DEFAULT 1 CHECK (adults > 0),
	children INT NOT NULL DEFAULT 0 CHECK (children >= 0),
	total_price NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
	status booking_status NOT NULL,
	rate NUMERIC(12, 2),
	source_channel VARCHAR(64),
	cancel_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_booking_date_range CHECK (check_out_date > check_in_date)
);

CREATE TABLE IF NOT EXISTS booking_services (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
	service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
	quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
	actual_price NUMERIC(12, 2) NOT NULL CHECK (actual_price >= 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT ux_booking_service UNIQUE (booking_id, service_id)
);

CREATE TABLE IF NOT EXISTS payments (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
	provider VARCHAR(64) NOT NULL,
	transaction_ref VARCHAR(255),
	amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
	currency CHAR(3) NOT NULL DEFAULT 'VND',
	status payment_status NOT NULL DEFAULT 'INITIATED',
	paid_at TIMESTAMPTZ,
	raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporary Room Holds
CREATE TABLE IF NOT EXISTS room_holds (
	id UUID PRIMARY KEY,
	room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
	customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	check_in_date VARCHAR(10) NOT NULL,
	check_out_date VARCHAR(10) NOT NULL,
	held_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expires_at TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing and Audit
-- pricing_seasons: mỗi season có thể áp dụng cho nhiều branch và nhiều loại phòng
-- branch_ids = {} (rỗng) → áp dụng TẤT CẢ chi nhánh
-- branch_ids = {id1, id2} → chỉ áp dụng cho các chi nhánh được chọn
-- room_type_ids = {} (rỗng) → áp dụng TẤT CẢ loại phòng
-- room_type_ids = {id1, id2} → chỉ áp dụng cho các loại phòng được chọn
CREATE TABLE IF NOT EXISTS pricing_seasons (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	-- branch_ids: danh sách branch áp dụng (rỗng = tất cả branch)
	branch_ids UUID[] NOT NULL DEFAULT '{}',
	-- room_type_ids: danh sách loại phòng áp dụng (rỗng = tất cả loại phòng)
	room_type_ids UUID[] NOT NULL DEFAULT '{}',
	name VARCHAR(255) NOT NULL,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL,
	discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
	notes TEXT,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_pricing_season_dates CHECK (ends_on >= starts_on),
	CONSTRAINT chk_pricing_discount_range CHECK (discount_percent >= -100 AND discount_percent <= 100)
);

-- Index để tìm nhanh season theo branch và ngày
CREATE INDEX IF NOT EXISTS idx_pricing_seasons_active ON pricing_seasons (is_active, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_pricing_seasons_branch_ids ON pricing_seasons USING GIN (branch_ids);
CREATE INDEX IF NOT EXISTS idx_pricing_seasons_room_type_ids ON pricing_seasons USING GIN (room_type_ids);

-- pricing_requests: Manager gửi yêu cầu điều chỉnh giá TẠM THỜI cho branch
-- Lý do: đông khách (tăng giá), ít khách (giảm giá), chênh lệch mặt bằng thị trường
-- Khi APPROVED: tạo pricing_season với branch_ids = [branch_id] (specific 1 branch)
-- discount_percent > 0 → giảm giá (khuyến mãi kích cầu)
-- discount_percent < 0 → tăng giá (surcharge mùa cao điểm)
-- starts_on / ends_on: khoảng thời gian áp dụng (bắt buộc — giá chỉ thay đổi tạm thời)
CREATE TABLE IF NOT EXISTS pricing_requests (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL,
	discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
	reason TEXT,
	notes TEXT,
	status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
	requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
	reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
	review_note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_pricing_request_dates CHECK (ends_on >= starts_on),
	CONSTRAINT chk_pricing_request_discount_range CHECK (discount_percent >= -100 AND discount_percent <= 100),
	CONSTRAINT chk_pricing_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS room_rate_change_audit (
	id BIGSERIAL PRIMARY KEY,
	room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
	old_rate NUMERIC(12, 2) NOT NULL,
	new_rate NUMERIC(12, 2) NOT NULL,
	change_percent NUMERIC(8, 2) NOT NULL,
	changed_by UUID,
	note TEXT,
	changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission_audit_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	action VARCHAR(50) NOT NULL,
	old_value TEXT,
	new_value TEXT,
	changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
	change_reason TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on branch coordinates for location queries
CREATE INDEX IF NOT EXISTS idx_branches_coordinates ON branches (latitude, longitude) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches (is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms (room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms (status);
CREATE INDEX IF NOT EXISTS idx_rooms_rating ON rooms (average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings (room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_branch ON bookings (branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_room_holds_expires_at ON room_holds (expires_at);
CREATE INDEX IF NOT EXISTS idx_room_holds_customer_id ON room_holds (customer_id);
CREATE INDEX IF NOT EXISTS idx_room_holds_room_id ON room_holds (room_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_branch_id ON user_branch_assignments (branch_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON permission_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created ON permission_audit_logs (created_at DESC);

-- Exclusion constraint: prevent overlapping bookings on same room
-- Removed DB-level exclusion constraint to rely on single pessimistic locking strategy in application
