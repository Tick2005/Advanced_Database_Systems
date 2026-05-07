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
		EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trg_name, t_name);
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
	IF NEW.rate IS DISTINCT FROM OLD.rate AND OLD.rate > 0 THEN
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
