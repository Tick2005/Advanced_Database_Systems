-- V8: Support Functions and Utilities

-- ============================================================================
-- FUNCTION: Calculate average rating for room (called from MongoDB feedback sync)
-- Aggregates from individual room ratings stored in PostgreSQL.
-- Actual rating sync from MongoDB is handled by Java service via
-- POST /admin/rooms/{roomId}/sync-ratings
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calc_room_average_rating(p_room_id UUID)
RETURNS double precision AS $$
DECLARE
  v_avg_rating double precision;
BEGIN
  SELECT average_rating INTO v_avg_rating
  FROM rooms WHERE id = p_room_id;
  RETURN COALESCE(v_avg_rating, 0.0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Verify email/password reset token
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_verify_email_token(p_token_hash VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find token and verify it's not expired
  SELECT user_id INTO v_user_id
  FROM verification_tokens
  WHERE token_hash = p_token_hash
    AND token_type = 'EMAIL_VERIFY'
    AND expires_at > CURRENT_TIMESTAMP
    AND verified_at IS NULL;
  
  IF v_user_id IS NOT NULL THEN
    -- Mark token as verified and update user
    UPDATE verification_tokens
    SET verified_at = CURRENT_TIMESTAMP
    WHERE token_hash = p_token_hash;
    
    UPDATE users
    SET email_verified = TRUE
    WHERE id = v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Cleanup expired unverified tokens
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_cleanup_expired_tokens()
RETURNS INT AS $$
BEGIN
  DELETE FROM verification_tokens
  WHERE token_type = 'EMAIL_VERIFY'
    AND verified_at IS NULL
    AND expires_at < CURRENT_TIMESTAMP;
  
  RETURN FOUND::INT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: User role and permission summary
-- ============================================================================
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  up.full_name,
  uba.branch_id,
  b.name AS branch_name,
  b.code AS branch_code
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_branch_assignments uba ON u.id = uba.user_id
LEFT JOIN branches b ON uba.branch_id = b.id
WHERE u.is_active = TRUE;

-- ============================================================================
-- VIEW: Pricing request status tracking
-- ============================================================================
CREATE OR REPLACE VIEW v_pricing_request_tracking AS
SELECT
  pr.id,
  pr.branch_id,
  b.name AS branch_name,
  pr.name AS request_name,
  pr.discount_percent,
  CASE
    WHEN pr.discount_percent > 0 THEN 'DECREASE'
    WHEN pr.discount_percent < 0 THEN 'INCREASE'
    ELSE 'NO_CHANGE'
  END AS price_direction,
  pr.starts_on,
  pr.ends_on,
  pr.reason,
  pr.notes,
  pr.status,
  up_req.full_name AS requested_by_name,
  up_rev.full_name AS reviewed_by_name,
  pr.review_note,
  pr.created_at,
  pr.updated_at
FROM pricing_requests pr
LEFT JOIN branches b ON pr.branch_id = b.id
LEFT JOIN user_profiles up_req ON pr.requested_by = up_req.user_id
LEFT JOIN user_profiles up_rev ON pr.reviewed_by = up_rev.user_id
ORDER BY pr.created_at DESC;

-- ============================================================================
-- FUNCTION: Get room availability for date range
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_room_availability(
  p_room_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE
)
RETURNS TABLE(is_available BOOLEAN, booked_count INT, hold_count INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE room_id = p_room_id
        AND status NOT IN ('CANCELLED', 'EXPIRED')
        AND NOT (p_check_out_date <= check_in_date OR p_check_in_date >= check_out_date)
    ) AS is_available,
    COUNT(CASE WHEN status NOT IN ('CANCELLED', 'EXPIRED') THEN 1 END)::INT,
    -- Active holds inferred from bookings in HOLD state created within the hold window (10 minutes)
    (SELECT COUNT(*)::INT FROM bookings WHERE room_id = p_room_id AND status = 'HOLD' AND created_at > (CURRENT_TIMESTAMP - INTERVAL '10 minutes'))
  FROM bookings
  WHERE room_id = p_room_id
    AND NOT (p_check_out_date <= check_in_date OR p_check_in_date >= check_out_date);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate booking revenue statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_booking_revenue_stats(
  p_branch_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  total_revenue NUMERIC,
  confirmed_bookings INT,
  pending_bookings INT,
  cancelled_bookings INT,
  avg_booking_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_price ELSE 0 END)::NUMERIC,
    COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::INT,
    COUNT(CASE WHEN status IN ('HOLD', 'PENDING_PAYMENT') THEN 1 END)::INT,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::INT,
    AVG(CASE WHEN status = 'CONFIRMED' THEN total_price ELSE NULL END)::NUMERIC
  FROM bookings
  WHERE branch_id = p_branch_id
    AND check_in_date >= p_start_date
    AND check_in_date <= p_end_date;
END;
$$ LANGUAGE plpgsql;
