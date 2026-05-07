CREATE OR REPLACE FUNCTION fn_get_room_rating(p_room_id UUID)
RETURNS NUMERIC(3, 2)
LANGUAGE plpgsql
AS $$
DECLARE
	v_rating NUMERIC(3, 2);
BEGIN
	SELECT COALESCE(r.average_rating, 0)
	INTO v_rating
	FROM rooms r
	WHERE r.id = p_room_id;

	RETURN COALESCE(v_rating, 0);
END;
$$;

CREATE OR REPLACE FUNCTION fn_upsert_room_type_rating(p_room_type_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE room_types rt
	SET average_rating = COALESCE(agg.avg_rating, 0)
	FROM (
		SELECT r.room_type_id, AVG(r.average_rating)::NUMERIC(3, 2) AS avg_rating
		FROM rooms r
		WHERE r.room_type_id = p_room_type_id
		GROUP BY r.room_type_id
	) agg
	WHERE rt.id = p_room_type_id;
END;
$$;
