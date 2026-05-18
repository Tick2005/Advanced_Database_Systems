-- V9: Utility Functions and Stored Procedures
--
-- NOTE: Email verification tokens are handled via JWT (JwtProvider) — no DB
-- table needed. User sessions are stored in MongoDB (sessions collection via
-- SessionDocument / SessionRepository). This file only contains reusable
-- PostgreSQL functions and stored procedures.

-- ============================================================================
-- FUNCTION: Upsert room type rating (called from MongoDB aggregation)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_upsert_room_type_rating(p_room_type_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_avg_rating DOUBLE PRECISION;
  v_review_count INT;
BEGIN
  -- In a real system, this would aggregate ratings from MongoDB feedback collection
  -- For now, calculate from individual room ratings in the same room_type
  SELECT 
    AVG(average_rating)::DOUBLE PRECISION,
    SUM(CASE WHEN average_rating > 0 THEN 1 ELSE 0 END)::INT
  INTO v_avg_rating, v_review_count
  FROM rooms
  WHERE room_type_id = p_room_type_id;
  
  UPDATE room_types
  SET average_rating = COALESCE(v_avg_rating, 0),
      review_count = COALESCE(v_review_count, 0),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_room_type_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get room rating (aggregates from feedback collection)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_room_rating(p_room_id UUID)
RETURNS TABLE(rating DOUBLE PRECISION, review_count INT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.average_rating, 
         (SELECT COUNT(*) FROM bookings WHERE room_id = p_room_id AND status = 'CHECKED_OUT')::INT
  FROM rooms r
  WHERE r.id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORED PROCEDURE: Assign user to branch with audit trail
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_assign_user_branch(
  p_user_id UUID,
  p_branch_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update assignment
  INSERT INTO user_branch_assignments (user_id, branch_id)
  VALUES (p_user_id, p_branch_id)
  ON CONFLICT (user_id) DO UPDATE
  SET branch_id = EXCLUDED.branch_id, updated_at = NOW();
  
  -- Audit trail is handled by trigger fn_audit_permission_change
  COMMIT;
END;
$$;

-- ============================================================================
-- STORED PROCEDURE: Revoke user from branch
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_revoke_user_branch(p_user_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_branch_assignments WHERE user_id = p_user_id;
  COMMIT;
END;
$$;

-- ============================================================================
-- FUNCTION: Get booking details with related entities
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_booking_details(p_booking_id UUID)
RETURNS TABLE(
  booking_id UUID,
  customer_name VARCHAR,
  room_number VARCHAR,
  branch_name VARCHAR,
  check_in_date DATE,
  check_out_date DATE,
  total_price NUMERIC,
  booking_status VARCHAR,
  payment_status VARCHAR,
  services TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    up.full_name,
    r.room_number,
    br.name,
    b.check_in_date,
    b.check_out_date,
    b.total_price,
    b.status::VARCHAR,
    p.status::VARCHAR,
    string_agg(s.name || ' (x' || bs.quantity::TEXT || ')', ', ')
  FROM bookings b
  LEFT JOIN user_profiles up ON b.customer_id = up.user_id
  LEFT JOIN rooms r ON b.room_id = r.id
  LEFT JOIN room_types rt ON r.room_type_id = rt.id
  LEFT JOIN branches br ON b.branch_id = br.id
  LEFT JOIN payments p ON b.id = p.booking_id
  LEFT JOIN booking_services bs ON b.id = bs.booking_id
  LEFT JOIN services s ON bs.service_id = s.id
  WHERE b.id = p_booking_id
  GROUP BY b.id, up.full_name, r.room_number, br.name, b.check_in_date, b.check_out_date,
           b.total_price, b.status, p.status;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get room occupancy rate for reporting
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_occupancy_rate(
  p_branch_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  occupancy_percent NUMERIC,
  occupied_nights INT,
  total_available_nights INT
) AS $$
BEGIN
  RETURN QUERY
  WITH room_counts AS (
    SELECT COUNT(*) as total_rooms
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE rt.branch_id = p_branch_id
  ),
  booking_data AS (
    SELECT 
      COUNT(*) as booked_nights,
      SUM(LEAST(check_out_date, p_end_date::DATE) - GREATEST(check_in_date, p_start_date::DATE))::INT as occupied_nights
    FROM bookings
    WHERE branch_id = p_branch_id
      AND status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
      AND check_in_date < p_end_date::DATE
      AND check_out_date > p_start_date::DATE
  )
  SELECT
    ROUND((bd.occupied_nights::NUMERIC / (rc.total_rooms * (p_end_date - p_start_date)::INT)) * 100, 2),
    bd.occupied_nights,
    rc.total_rooms * (p_end_date - p_start_date)::INT
  FROM room_counts rc, booking_data bd;
END;
$$ LANGUAGE plpgsql;
