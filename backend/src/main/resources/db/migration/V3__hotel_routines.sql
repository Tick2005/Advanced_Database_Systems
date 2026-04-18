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

