-- V2: Top Rooms Ranking and Auto-Update Triggers
-- ============================================================================
-- ĐÁP ỨNG YÊU CẦU ĐỀ BÀI:
--   ✅ "Create a SQL Trigger that notifies a log table whenever a room rate
--      is changed by >50%"
--   → fn_audit_room_rate_change() + trg_rooms_audit_rate_change
--      Ghi vào bảng room_rate_change_audit khi |change_percent| > 50%
-- ============================================================================

-- ============================================================================
-- TRIGGERS: Auto-update timestamps and audit room rate changes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

-- Apply touch_updated_at trigger to all major tables
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

-- Audit room rate changes exceeding 50%
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


-- Problem with V2 formula: `5 * max(0, 1 - dist / 50)` caps relevance at 50 km.
-- Vietnam branches span ~2000 km (Hanoi → Ca Mau). Any branch beyond 50 km
-- received a distance score of 0, making the distance component useless for
-- the vast majority of real user positions.
--
-- New unified scoring formula (0–10 total):
--   rating_score  = (average_rating / 5.0) * 5.0          → 0–5 pts, linear
--   distance_score = 5.0 * max(0, 1 - dist_km / 2000.0)   → 0–5 pts, linear, cap 2000 km
--   total_score   = rating_score + distance_score
--
-- Without location: score = rating_score only (0–5 pts), order by rating DESC.
-- With location:    score = rating_score + distance_score (0–10 pts).
--
-- 2000 km cap rationale:
--   Hanoi (21.03°N) → Ca Mau (9.18°N) ≈ 1700 km straight-line.
--   A user in Hanoi looking at a Hanoi branch (0 km) gets +5.0 distance pts.
--   A user in Hanoi looking at Ca Mau branch (~1700 km) gets +0.75 distance pts.
--   This gives meaningful differentiation across the entire country.

CREATE OR REPLACE FUNCTION get_top_rooms_by_location(
  p_user_latitude  DOUBLE PRECISION DEFAULT NULL,
  p_user_longitude DOUBLE PRECISION DEFAULT NULL,
  p_limit          INT              DEFAULT 4
)
RETURNS TABLE (
  room_id          UUID,
  room_number      VARCHAR,
  average_rating   DOUBLE PRECISION,
  score            DOUBLE PRECISION,
  rate             NUMERIC,
  status           VARCHAR,
  max_occupancy    INT,
  room_type_id     UUID,
  room_type_name   VARCHAR,
  branch_id        UUID,
  branch_name      VARCHAR,
  branch_city      VARCHAR,
  branch_latitude  DOUBLE PRECISION,
  branch_longitude DOUBLE PRECISION,
  distance_km      DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      r.id                  AS room_id,
      r.room_number,
      r.average_rating,
      r.rate,
      r.status::VARCHAR     AS status,
      r.max_occupancy,
      rt.id                 AS room_type_id,
      rt.name               AS room_type_name,
      b.id                  AS branch_id,
      b.name                AS branch_name,
      b.city                AS branch_city,
      b.latitude            AS branch_latitude,
      b.longitude           AS branch_longitude,
      -- Haversine distance in km (NULL when no user location provided)
      CASE
        WHEN p_user_latitude IS NOT NULL AND p_user_longitude IS NOT NULL
        THEN (
          6371.0 * 2.0 * ASIN(SQRT(
            POWER(SIN(RADIANS((b.latitude  - p_user_latitude)  / 2.0)), 2) +
            COS(RADIANS(p_user_latitude)) * COS(RADIANS(b.latitude)) *
            POWER(SIN(RADIANS((b.longitude - p_user_longitude) / 2.0)), 2)
          ))
        )::DOUBLE PRECISION
        ELSE NULL::DOUBLE PRECISION
      END AS distance_km
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    JOIN branches   b  ON b.id  = rt.branch_id
    WHERE rt.is_active = TRUE
      AND b.is_active  = TRUE
      AND r.status     = 'AVAILABLE'
  ),
  scored AS (
    SELECT
      base.*,
      -- rating component: linear 0–5
      ROUND(
        (COALESCE(base.average_rating, 0.0) / 5.0 * 5.0)::NUMERIC, 4
      )::DOUBLE PRECISION AS rating_score,
      -- distance component: linear 0–5, capped at 2000 km (Vietnam end-to-end)
      CASE
        WHEN base.distance_km IS NULL THEN 0.0::DOUBLE PRECISION
        ELSE ROUND(
          (5.0 * GREATEST(0.0, 1.0 - base.distance_km / 2000.0))::NUMERIC, 4
        )::DOUBLE PRECISION
      END AS distance_score
    FROM base
  )
  SELECT
    scored.room_id,
    scored.room_number,
    scored.average_rating,
    -- total score: rating only when no location, rating+distance when location present
    CASE
      WHEN p_user_latitude IS NULL OR p_user_longitude IS NULL
        THEN scored.rating_score
      ELSE scored.rating_score + scored.distance_score
    END AS score,
    scored.rate,
    scored.status,
    scored.max_occupancy,
    scored.room_type_id,
    scored.room_type_name,
    scored.branch_id,
    scored.branch_name,
    scored.branch_city,
    scored.branch_latitude,
    scored.branch_longitude,
    scored.distance_km
  FROM scored
  ORDER BY
    -- Available rooms always first
    CASE WHEN scored.status = 'AVAILABLE' THEN 0 ELSE 1 END ASC,
    -- Primary: blended score descending
    (CASE
      WHEN p_user_latitude IS NULL OR p_user_longitude IS NULL
        THEN scored.rating_score
      ELSE scored.rating_score + scored.distance_score
    END) DESC,
    -- Tiebreak 1: closer branch first (NULL last)
    scored.distance_km ASC NULLS LAST,
    -- Tiebreak 2: higher rating first
    scored.average_rating DESC NULLS LAST,
    -- Tiebreak 3: room number for stable ordering
    scored.room_number ASC
  LIMIT COALESCE(p_limit, 4);
END;
$$ LANGUAGE plpgsql STABLE;
