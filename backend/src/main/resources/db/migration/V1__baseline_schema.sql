-- Consolidated baseline migration


-- ===== BEGIN V1__hotel_core_schema.sql =====

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
		CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'MANAGER', 'OWNER');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
		CREATE TYPE room_status AS ENUM ('AVAILABLE', 'HELD', 'OCCUPIED', 'MAINTENANCE');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
		CREATE TYPE booking_status AS ENUM ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
		CREATE TYPE payment_status AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_mode') THEN
		CREATE TYPE service_mode AS ENUM ('PREBOOK', 'ON_SITE', 'BOTH');
	END IF;
END $$;

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
	average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
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
	hold_expires_at TIMESTAMPTZ,
	payment_due_at TIMESTAMPTZ,
	source_channel VARCHAR(64),
	cancel_reason TEXT,
	confirmed_at TIMESTAMPTZ,
	cancelled_at TIMESTAMPTZ,
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

CREATE TABLE IF NOT EXISTS pricing_seasons (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
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

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_rooms_current_booking'
	) THEN
		ALTER TABLE rooms
			ADD CONSTRAINT fk_rooms_current_booking
			FOREIGN KEY (current_booking_id)
			REFERENCES bookings(id)
			ON DELETE SET NULL;
	END IF;
END $$;


-- ===== END V1__hotel_core_schema.sql =====


-- ===== BEGIN V2__hotel_reporting_views.sql =====

CREATE OR REPLACE VIEW v_branch_tree AS
WITH RECURSIVE branch_cte AS (
	SELECT
		b.id,
		b.parent_branch_id,
		b.code,
		b.name,
		b.country,
		b.city,
		b.timezone,
		b.is_active,
		1 AS depth,
		b.name::TEXT AS path_name
	FROM branches b
	WHERE b.parent_branch_id IS NULL

	UNION ALL

	SELECT
		c.id,
		c.parent_branch_id,
		c.code,
		c.name,
		c.country,
		c.city,
		c.timezone,
		c.is_active,
		p.depth + 1,
		CONCAT(p.path_name, ' > ', c.name)
	FROM branches c
	JOIN branch_cte p ON p.id = c.parent_branch_id
)
SELECT * FROM branch_cte;

CREATE OR REPLACE VIEW v_branch_cover_image AS
SELECT DISTINCT ON (bi.branch_id)
	bi.branch_id,
	bi.image_url,
	bi.alt_text,
	bi.is_cover,
	bi.sort_order
FROM branch_images bi
ORDER BY bi.branch_id, bi.is_cover DESC, bi.sort_order ASC, bi.created_at ASC;

CREATE OR REPLACE VIEW v_public_room_showcase AS
SELECT
	rt.id AS room_type_id,
	rt.branch_id,
	b.name AS branch_name,
	b.city AS branch_city,
	rt.code,
	rt.name,
	rt.slug,
	rt.base_price,
	rt.capacity,
	rt.bed_type,
	rt.amenities,
	rt.average_rating,
	rt.review_count,
	rt.is_featured,
	COALESCE(available_rooms.available_count, 0) AS available_room_count,
	cover.image_url AS cover_image_url
FROM room_types rt
JOIN branches b ON b.id = rt.branch_id
LEFT JOIN (
	SELECT r.room_type_id, COUNT(*) AS available_count
	FROM rooms r
	WHERE r.status = 'AVAILABLE'
	GROUP BY r.room_type_id
) available_rooms ON available_rooms.room_type_id = rt.id
LEFT JOIN (
	SELECT DISTINCT ON (rti.room_type_id)
		rti.room_type_id,
		rti.image_url
	FROM room_type_images rti
	ORDER BY rti.room_type_id, rti.is_cover DESC, rti.sort_order ASC, rti.created_at ASC
) cover ON cover.room_type_id = rt.id
WHERE rt.is_active = TRUE
  AND b.is_active = TRUE;

CREATE OR REPLACE VIEW v_room_showcase AS
SELECT
	r.id AS room_id,
	r.room_number,
	r.floor,
	r.status,
	r.rate,
	r.max_occupancy,
	rt.id AS room_type_id,
	rt.name AS room_type_name,
	rt.slug AS room_type_slug,
	rt.capacity AS room_type_capacity,
	b.id AS branch_id,
	b.name AS branch_name,
	b.city AS branch_city
FROM rooms r
JOIN room_types rt ON rt.id = r.room_type_id
JOIN branches b ON b.id = rt.branch_id;

CREATE OR REPLACE VIEW v_service_showcase AS
SELECT
	s.id AS service_id,
	s.branch_id,
	b.name AS branch_name,
	s.code,
	s.name,
	s.description,
	s.thumbnail_url,
	s.price,
	s.service_mode,
	s.is_active
FROM services s
JOIN branches b ON b.id = s.branch_id
WHERE s.is_active = TRUE
  AND b.is_active = TRUE;

CREATE OR REPLACE VIEW v_room_type_profit_ranked AS
WITH room_type_revenue AS (
	SELECT
		rt.id AS room_type_id,
		rt.branch_id,
		DATE_TRUNC('quarter', bkg.created_at)::DATE AS revenue_quarter,
		SUM(bkg.total_price) AS total_revenue
	FROM bookings bkg
	JOIN rooms r ON r.id = bkg.room_id
	JOIN room_types rt ON rt.id = r.room_type_id
	WHERE bkg.status = 'CONFIRMED'
	GROUP BY rt.id, rt.branch_id, DATE_TRUNC('quarter', bkg.created_at)::DATE
)
SELECT
	rtr.room_type_id,
	rtr.branch_id,
	rtr.revenue_quarter,
	rtr.total_revenue,
	DENSE_RANK() OVER (
		PARTITION BY rtr.branch_id, rtr.revenue_quarter
		ORDER BY rtr.total_revenue DESC
	) AS profit_rank
FROM room_type_revenue rtr;

CREATE OR REPLACE VIEW v_top_room_types_by_profit AS
SELECT
	v.room_type_id,
	rt.name AS room_type_name,
	v.branch_id,
	b.name AS branch_name,
	v.revenue_quarter,
	v.total_revenue,
	v.profit_rank
FROM v_room_type_profit_ranked v
JOIN room_types rt ON rt.id = v.room_type_id
JOIN branches b ON b.id = v.branch_id
WHERE v.profit_rank <= 3;

CREATE OR REPLACE VIEW v_room_revenue_by_quarter AS
SELECT
	r.id AS room_id,
	rt.branch_id,
	DATE_TRUNC('quarter', bkg.created_at)::DATE AS revenue_quarter,
	SUM(bkg.total_price) AS total_revenue,
	COUNT(*) AS booking_count
FROM bookings bkg
JOIN rooms r ON r.id = bkg.room_id
JOIN room_types rt ON rt.id = r.room_type_id
WHERE bkg.status = 'CONFIRMED'
GROUP BY r.id, rt.branch_id, DATE_TRUNC('quarter', bkg.created_at)::DATE;

CREATE OR REPLACE VIEW v_top_3_revenue_rooms_per_branch_quarter AS
WITH ranked_rooms AS (
	SELECT
		vr.room_id,
		vr.branch_id,
		vr.revenue_quarter,
		vr.total_revenue,
		DENSE_RANK() OVER (
			PARTITION BY vr.branch_id, vr.revenue_quarter
			ORDER BY vr.total_revenue DESC
		) AS revenue_rank
	FROM v_room_revenue_by_quarter vr
)
SELECT
	rr.room_id,
	rr.branch_id,
	b.name AS branch_name,
	rr.revenue_quarter,
	rr.total_revenue,
	rr.revenue_rank
FROM ranked_rooms rr
JOIN branches b ON b.id = rr.branch_id
WHERE rr.revenue_rank <= 3;

CREATE OR REPLACE VIEW v_branch_dashboard_summary AS
SELECT
	b.id AS branch_id,
	b.name AS branch_name,
	b.city AS branch_city,
	COUNT(DISTINCT rt.id) AS room_type_count,
	COUNT(DISTINCT r.id) AS room_count,
	COUNT(DISTINCT CASE WHEN r.status = 'AVAILABLE' THEN r.id END) AS available_room_count,
	COUNT(DISTINCT CASE WHEN bkg.status = 'CONFIRMED' THEN bkg.id END) AS confirmed_booking_count,
	COALESCE(SUM(CASE WHEN bkg.status = 'CONFIRMED' THEN bkg.total_price ELSE 0 END), 0) AS total_revenue
FROM branches b
LEFT JOIN room_types rt ON rt.branch_id = b.id
LEFT JOIN rooms r ON r.room_type_id = rt.id
LEFT JOIN bookings bkg ON bkg.branch_id = b.id
GROUP BY b.id, b.name, b.city;


-- ===== END V2__hotel_reporting_views.sql =====


-- ===== BEGIN V3__hotel_routines.sql =====

CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

DO $$
DECLARE
	t_name TEXT;
	trg_name TEXT;
BEGIN
	FOREACH t_name IN ARRAY ARRAY[
		'users',
		'user_profiles',
		'branches',
		'branch_images',
		'room_types',
		'room_type_images',
		'rooms',
		'room_images',
		'services',
		'service_images',
		'bookings',
		'booking_services',
		'payments',
		'pricing_seasons'
	]
	LOOP
		trg_name := format('trg_%s_touch_updated_at', t_name);

		IF EXISTS (
			SELECT 1
			FROM pg_trigger
			WHERE tgname = trg_name
		) THEN
			EXECUTE format('DROP TRIGGER %I ON %I', trg_name, t_name);
		END IF;

		EXECUTE format(
			'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at()',
			trg_name,
			t_name
		);
	END LOOP;
END $$;

CREATE OR REPLACE FUNCTION fn_audit_room_rate_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
	v_change_percent NUMERIC(8, 2);
BEGIN
	IF NEW.rate IS DISTINCT FROM OLD.rate
	   AND OLD.rate > 0 THEN
		v_change_percent = ROUND(((NEW.rate - OLD.rate) / OLD.rate) * 100, 2);

		IF ABS(v_change_percent) > 50 THEN
			INSERT INTO room_rate_change_audit (
				room_id,
				old_rate,
				new_rate,
				change_percent,
				changed_by,
				note
			)
			VALUES (
				NEW.id,
				OLD.rate,
				NEW.rate,
				v_change_percent,
				NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
				'Auto audit: room rate changed over 50 percent'
			);
		END IF;
	END IF;

	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rooms_audit_rate_change ON rooms;
CREATE TRIGGER trg_rooms_audit_rate_change
AFTER UPDATE OF rate ON rooms
FOR EACH ROW
EXECUTE FUNCTION fn_audit_room_rate_change();

CREATE OR REPLACE FUNCTION fn_hold_room_booking(
	p_customer_id UUID,
	p_room_id UUID,
	p_branch_id UUID,
	p_check_in_date DATE,
	p_check_out_date DATE,
	p_adults INT DEFAULT 1,
	p_children INT DEFAULT 0,
	p_total_price NUMERIC(14, 2) DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
	v_room_status room_status;
	v_booking_id UUID;
BEGIN
	IF p_check_out_date <= p_check_in_date THEN
		RAISE EXCEPTION 'check_out_date must be greater than check_in_date';
	END IF;

	SELECT r.status
	INTO v_room_status
	FROM rooms r
	WHERE r.id = p_room_id
	FOR UPDATE;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Room % not found', p_room_id;
	END IF;

	IF v_room_status = 'MAINTENANCE' THEN
		RAISE EXCEPTION 'Room % is under maintenance', p_room_id;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM bookings b
		WHERE b.room_id = p_room_id
		  AND b.status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED')
		  AND b.check_in_date < p_check_out_date
		  AND b.check_out_date > p_check_in_date
	) THEN
		RAISE EXCEPTION 'Double booking detected for room %', p_room_id;
	END IF;

	INSERT INTO bookings (
		customer_id,
		room_id,
		branch_id,
		check_in_date,
		check_out_date,
		adults,
		children,
		total_price,
		status,
		hold_expires_at,
		payment_due_at,
		source_channel
	)
	VALUES (
		p_customer_id,
		p_room_id,
		p_branch_id,
		p_check_in_date,
		p_check_out_date,
		COALESCE(p_adults, 1),
		COALESCE(p_children, 0),
		COALESCE(p_total_price, 0),
		'HOLD',
		NOW() + INTERVAL '15 minutes',
		NOW() + INTERVAL '15 minutes',
		'WEB'
	)
	RETURNING id INTO v_booking_id;

	UPDATE rooms
	SET status = 'HELD',
		current_booking_id = v_booking_id
	WHERE id = p_room_id;

	RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_confirm_room_booking(
	p_booking_id UUID,
	p_transaction_ref TEXT,
	p_provider TEXT DEFAULT 'VNPAY',
	p_currency CHAR(3) DEFAULT 'VND',
	p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
	v_room_id UUID;
	v_booking_status booking_status;
	v_amount NUMERIC(14, 2);
BEGIN
	SELECT b.room_id, b.status, b.total_price
	INTO v_room_id, v_booking_status, v_amount
	FROM bookings b
	WHERE b.id = p_booking_id
	FOR UPDATE;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Booking % not found', p_booking_id;
	END IF;

	IF v_booking_status NOT IN ('HOLD', 'PENDING_PAYMENT') THEN
		RAISE EXCEPTION 'Booking % is not in confirmable status (%).', p_booking_id, v_booking_status;
	END IF;

	INSERT INTO payments (
		booking_id,
		provider,
		transaction_ref,
		amount,
		currency,
		status,
		paid_at,
		raw_payload
	)
	VALUES (
		p_booking_id,
		p_provider,
		p_transaction_ref,
		v_amount,
		p_currency,
		'SUCCESS',
		NOW(),
		COALESCE(p_raw_payload, '{}'::jsonb)
	)
	ON CONFLICT (booking_id)
	DO UPDATE SET
		provider = EXCLUDED.provider,
		transaction_ref = EXCLUDED.transaction_ref,
		amount = EXCLUDED.amount,
		currency = EXCLUDED.currency,
		status = 'SUCCESS',
		paid_at = NOW(),
		raw_payload = EXCLUDED.raw_payload,
		updated_at = NOW();

	UPDATE bookings
	SET status = 'CONFIRMED',
		confirmed_at = NOW(),
		hold_expires_at = NULL,
		payment_due_at = NULL
	WHERE id = p_booking_id;

	UPDATE rooms
	SET status = 'OCCUPIED',
		current_booking_id = p_booking_id
	WHERE id = v_room_id;
END;
$$;


-- ===== END V3__hotel_routines.sql =====


-- ===== BEGIN V5__hotel_indexes_optimization.sql =====

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


-- ===== END V5__hotel_indexes_optimization.sql =====


-- ===== BEGIN V6__hotel_permissions.sql =====

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_readonly') THEN
		CREATE ROLE hotel_readonly;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_readwrite') THEN
		CREATE ROLE hotel_readwrite;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_app') THEN
		CREATE ROLE hotel_app;
	END IF;
END $$;

GRANT USAGE ON SCHEMA public TO hotel_readonly, hotel_readwrite, hotel_app;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_readonly;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hotel_readwrite;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hotel_readwrite;

GRANT hotel_readwrite TO hotel_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT SELECT ON TABLES TO hotel_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hotel_readwrite;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hotel_readwrite;


-- ===== END V6__hotel_permissions.sql =====


-- ===== BEGIN V7__hotel_pricing_requests.sql =====

CREATE TABLE IF NOT EXISTS pricing_requests (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL,
	discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
	notes TEXT,
	status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
	requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
	reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
	review_note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_pricing_request_dates CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_pricing_requests_branch_status
	ON pricing_requests (branch_id, status, created_at DESC);

-- ===== END V7__hotel_pricing_requests.sql =====


-- ===== BEGIN V8__booking_status_checkin_checkout.sql =====

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'booking_status' AND n.nspname = 'public'
    ) THEN
        BEGIN
            ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CHECKED_IN';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CHECKED_OUT';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- ===== END V8__booking_status_checkin_checkout.sql =====


-- ===== BEGIN V9__hotel_user_branch_assignments.sql =====

CREATE TABLE IF NOT EXISTS user_branch_assignments (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_branch_id
	ON user_branch_assignments (branch_id);

-- ===== END V9__hotel_user_branch_assignments.sql =====


-- ===== BEGIN V11__payment_transaction_ref_unique.sql =====

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_transaction_ref
	ON payments (transaction_ref)
	WHERE transaction_ref IS NOT NULL;

-- ===== END V11__payment_transaction_ref_unique.sql =====


-- ===== BEGIN V12__booking_conflict_enforcement_and_view.sql =====

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'ex_bookings_room_date_overlap'
	) THEN
		ALTER TABLE bookings
		ADD CONSTRAINT ex_bookings_room_date_overlap
		EXCLUDE USING GIST (
			room_id WITH =,
			daterange(check_in_date, check_out_date, '[)') WITH &&
		)
		WHERE (status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'));
	END IF;
END
$$;

CREATE OR REPLACE VIEW v_booking_conflicts AS
SELECT
	b1.id AS booking_id,
	b2.id AS conflicting_booking_id,
	b1.room_id,
	b1.branch_id,
	b1.status AS booking_status,
	b2.status AS conflicting_status,
	b1.check_in_date,
	b1.check_out_date,
	b2.check_in_date AS conflicting_check_in_date,
	b2.check_out_date AS conflicting_check_out_date,
	GREATEST(b1.check_in_date, b2.check_in_date) AS overlap_start,
	LEAST(b1.check_out_date, b2.check_out_date) AS overlap_end
FROM bookings b1
JOIN bookings b2
	ON b1.room_id = b2.room_id
	AND b1.id < b2.id
	AND b1.check_in_date < b2.check_out_date
	AND b1.check_out_date > b2.check_in_date
WHERE b1.status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN')
	AND b2.status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN');

-- ===== END V12__booking_conflict_enforcement_and_view.sql =====


-- ===== BEGIN V13__outbox_and_saga_events.sql =====

-- ============================================================================
-- Outbox Pattern + Saga State Management for Postgres ↔ MongoDB Consistency
-- ============================================================================
-- This migration consolidates event sourcing infrastructure for:
-- 1. Outbox table: Transactional log for events persisted atomically with business data
-- 2. Saga status tracking: Distributed transaction orchestration state
-- 3. Event type enumeration: Typed events for booking/payment/feedback flows
-- ============================================================================

-- ============================================================================
-- 1. OUTBOX TABLE: Transactional Event Log (Pattern: Outbox/Event Sourcing)
-- ============================================================================
-- Purpose: Ensure events are persisted atomically with booking/payment state changes
-- Strategy: Same transaction that modifies booking ALSO inserts into outbox
-- Consumer: OutboxPoller (separate service thread) publishes these to MongoDB
-- Guarantee: If booking state changes, event will eventually reach MongoDB
-- ============================================================================

CREATE TABLE IF NOT EXISTS outbox (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    last_error TEXT,
    version INT NOT NULL DEFAULT 1
);

-- Index for polling unpublished events efficiently
CREATE INDEX IF NOT EXISTS ix_outbox_unpublished 
    ON outbox(created_at) 
    WHERE published = FALSE;

-- Index for finding events by aggregate (debugging/replay)
CREATE INDEX IF NOT EXISTS ix_outbox_aggregate 
    ON outbox(aggregate_type, aggregate_id, created_at);

-- Unique constraint: Prevent duplicate event publication attempts
-- This helps with idempotency if outbox poller retries
CREATE UNIQUE INDEX IF NOT EXISTS ux_outbox_idempotency
    ON outbox(aggregate_id, event_type, created_at)
    WHERE published = FALSE;

-- ============================================================================
-- 2. SAGA STATUS TABLE: Distributed Transaction State Machine
-- ============================================================================
-- Purpose: Track multi-step sagas across Postgres + MongoDB
-- Example saga: BookingConfirmed (Postgres) → CreateFeedback (MongoDB) → UpdateStats
-- State transitions: PENDING → COMPENSATING → COMPLETED / FAILED / ROLLED_BACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS saga_instances (
    saga_id UUID PRIMARY KEY,
    saga_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED, COMPENSATING, ROLLED_BACK
    current_step INT DEFAULT 0,
    total_steps INT NOT NULL,
    payload JSONB NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    last_error TEXT,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_saga_by_aggregate 
    ON saga_instances(aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS ix_saga_by_status 
    ON saga_instances(status, started_at)
    WHERE status IN ('PENDING', 'IN_PROGRESS', 'COMPENSATING');

-- ============================================================================
-- 3. SAGA STEP RESULTS TABLE: Audit Trail & Compensation Pointers
-- ============================================================================
-- Purpose: Record each step in saga execution for debugging + compensation
-- Used by: Saga orchestrator to determine what needs rollback if step fails
-- ============================================================================

CREATE TABLE IF NOT EXISTS saga_step_results (
    id BIGSERIAL PRIMARY KEY,
    saga_id UUID NOT NULL REFERENCES saga_instances(saga_id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, PENDING
    result_payload JSONB,
    compensation_data JSONB, -- Data needed to undo this step
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    UNIQUE(saga_id, step_number)
);

CREATE INDEX IF NOT EXISTS ix_saga_steps_by_saga 
    ON saga_step_results(saga_id, step_number);

-- ============================================================================
-- 4. EVENT STORE TABLE: Optional - Complete Event History (Advanced Pattern)
-- ============================================================================
-- Purpose: Immutable log of ALL events (even after published to MongoDB)
-- Use case: Event replay, debugging, audit trail, temporal queries
-- Note: Can be archived/purged independently from outbox
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_store (
    event_id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}', -- e.g., {"user_id": "...", "ip": "...", "trace_id": "..."}
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL, -- 'APPLICATION' | 'MONGODB' | 'MANUAL'
    version INT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_event_store_aggregate 
    ON event_store(aggregate_type, aggregate_id, version);

CREATE INDEX IF NOT EXISTS ix_event_store_type 
    ON event_store(event_type, occurred_at DESC);

-- ============================================================================
-- 5. DEAD LETTER QUEUE (DLQ): Failed Event Publishing Records
-- ============================================================================
-- Purpose: Capture events that failed to publish after max retries
-- Strategy: OutboxPoller moves failed events here; manual intervention required
-- Operator action: Fix upstream issue, then replay from DLQ
-- ============================================================================

CREATE TABLE IF NOT EXISTS outbox_dlq (
    id BIGSERIAL PRIMARY KEY,
    original_outbox_id BIGINT,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    retry_count INT NOT NULL,
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS ix_dlq_by_aggregate 
    ON outbox_dlq(aggregate_type, aggregate_id)
    WHERE resolved = FALSE;

-- ============================================================================
-- 6. APPLY BTREE_GIST EXTENSION IF NOT ALREADY APPLIED (from V12)
-- ============================================================================
-- Ensure range-based conflict detection available for booking overlaps

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 7. ADD AUDIT COLUMNS TO EXISTING TABLES
-- ============================================================================
-- Minimal changes to existing tables to support event sourcing

-- Booking table: Add version for optimistic locking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS saga_id UUID;

-- Payment table: Add version + reference to triggering event
ALTER TABLE payments ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS outbox_id BIGINT;

-- Add index for saga correlation
CREATE INDEX IF NOT EXISTS ix_bookings_saga_id 
    ON bookings(saga_id)
    WHERE saga_id IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION: Outbox + Saga Infrastructure
-- ============================================================================
-- Next steps:
-- 1. Deploy this migration to activate Postgres infrastructure
-- 2. Deploy Java entities and repositories for OutboxEvent, SagaInstance, SagaStepResult
-- 3. Implement OutboxPoller to consume outbox and publish to MongoDB
-- 4. Implement SagaOrchestrator to coordinate multi-step transactions
-- 5. Add @Transactional service methods that emit events to outbox
-- 6. Add integration tests for cross-store consistency scenarios
-- ============================================================================

-- ===== END V13__outbox_and_saga_events.sql =====

