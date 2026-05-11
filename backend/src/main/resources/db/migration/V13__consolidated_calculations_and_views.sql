-- V13: Consolidated Calculation Views, Functions & Procedures
-- Purpose: Move business logic from Java service layer to PostgreSQL
-- Includes: Permission audit logging, token verification, booking expiry logic, branch/permission checks

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 1: RATING CALCULATION VIEWS & FUNCTIONS (MongoDB-based, for documentation)
   ═══════════════════════════════════════════════════════════════════════════════ 
   
   These are implemented in MongoDB via FeedbackRepository.aggregateRoomFeedbackSummaries()
   Aggregation pipeline: $match -> $group -> $project
   Use: FeedbackService.getRoomSummaries() calls repository aggregation
   
   Future migration: If feedbacks are synced to PostgreSQL, create views below.
   
*/

-- Table: Permission change audit trail (for tracking user permission modifications)
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'ASSIGN_BRANCH', 'REVOKE_BRANCH', 'ROLE_CHANGE'
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON permission_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created ON permission_audit_logs(created_at DESC);

-- Function: Log permission changes (called by trigger on user_branch_assignments)
CREATE OR REPLACE FUNCTION fn_audit_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO permission_audit_logs(user_id, action, old_value, new_value, created_at)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'ASSIGN_BRANCH'
      WHEN TG_OP = 'DELETE' THEN 'REVOKE_BRANCH'
      ELSE 'UPDATE_BRANCH'
    END,
    CASE WHEN OLD IS NOT NULL THEN OLD.branch_id::text ELSE NULL END,
    CASE WHEN NEW IS NOT NULL THEN NEW.branch_id::text ELSE NULL END,
    CURRENT_TIMESTAMP
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Capture permission changes
DROP TRIGGER IF EXISTS trg_audit_permission_changes ON user_branch_assignments;
CREATE TRIGGER trg_audit_permission_changes
AFTER INSERT OR UPDATE OR DELETE ON user_branch_assignments
FOR EACH ROW EXECUTE FUNCTION fn_audit_permission_changes();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 4: TOKEN & VERIFICATION LOGIC
   ───────────────────────────────────────────────────────────────────────────── */

-- Table: Email verification tokens (moved from Java + MongoDB)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  token_type VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFICATION', -- 'EMAIL_VERIFICATION', 'PASSWORD_RESET'
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_token_hash ON verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_tokens(expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_verified ON verification_tokens(verified_at);

-- Function: Clean expired verification tokens
CREATE OR REPLACE FUNCTION fn_cleanup_expired_tokens()
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < CURRENT_TIMESTAMP AND verified_at IS NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Verify email token
CREATE OR REPLACE FUNCTION fn_verify_email_token(p_token_hash VARCHAR)
RETURNS TABLE(user_id UUID, success bool) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM verification_tokens
  WHERE token_hash = p_token_hash
    AND token_type = 'EMAIL_VERIFICATION'
    AND expires_at > CURRENT_TIMESTAMP
    AND verified_at IS NULL;

  IF v_user_id IS NOT NULL THEN
    UPDATE verification_tokens
    SET verified_at = CURRENT_TIMESTAMP
    WHERE user_id = v_user_id AND token_type = 'EMAIL_VERIFICATION';
    
    UPDATE users SET is_verified = true WHERE id = v_user_id;
    
    RETURN QUERY SELECT v_user_id, true;
  ELSE
    RETURN QUERY SELECT NULL::UUID, false;
  END IF;
END;
$$ LANGUAGE plpgsql;

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 5: BOOKING EXPIRY & AUTO-UPDATE LOGIC
   ═══════════════════════════════════════════════════════════════════════════════ */

-- Function: Auto-expire bookings with expired hold times
CREATE OR REPLACE FUNCTION fn_auto_expire_bookings()
RETURNS TABLE(expired_count int, cancelled_count int) AS $$
DECLARE
  v_expired_count int := 0;
  v_cancelled_count int := 0;
BEGIN
  -- Expire bookings with expired hold times
  UPDATE bookings
  SET status = 'EXPIRED'::booking_status, updated_at = CURRENT_TIMESTAMP
  WHERE status = 'HOLD'
    AND hold_expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Auto-cancel pending bookings past payment due date
  UPDATE bookings
  SET status = 'CANCELLED'::booking_status, cancel_reason = 'Payment due date passed'
  WHERE status = 'PENDING'
    AND payment_due_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

  RETURN QUERY SELECT v_expired_count, v_cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Check if booking can transition to next status
CREATE OR REPLACE FUNCTION fn_can_transition_booking_status(
  p_booking_id UUID,
  p_from_status booking_status,
  p_to_status booking_status
)
RETURNS bool AS $$
DECLARE
  v_current_status booking_status;
  v_hold_expires TIMESTAMP;
BEGIN
  SELECT status, hold_expires_at INTO v_current_status, v_hold_expires
  FROM bookings WHERE id = p_booking_id;

  -- Check status exists
  IF v_current_status IS NULL THEN
    RETURN false;
  END IF;

  -- Check current status matches expected 'from' status
  IF v_current_status != p_from_status THEN
    RETURN false;
  END IF;

  -- If transitioning from HOLD, check it hasn't expired
  IF p_from_status = 'HOLD'::booking_status AND v_hold_expires < CURRENT_TIMESTAMP THEN
    RETURN false;
  END IF;

  -- Valid transitions:
  -- HOLD -> CONFIRMED (after payment)
  -- HOLD -> EXPIRED (timeout)
  -- HOLD -> CANCELLED (user action)
  -- CONFIRMED -> CHECKED_IN (at check-in date)
  -- CONFIRMED -> CANCELLED (cancellation policy allows)
  -- CHECKED_IN -> CHECKED_OUT (at check-out date or manual)
  RETURN CASE
    WHEN p_from_status = 'HOLD'::booking_status THEN p_to_status IN ('CONFIRMED'::booking_status, 'EXPIRED'::booking_status, 'CANCELLED'::booking_status)
    WHEN p_from_status = 'CONFIRMED'::booking_status THEN p_to_status IN ('CHECKED_IN'::booking_status, 'CANCELLED'::booking_status)
    WHEN p_from_status = 'CHECKED_IN'::booking_status THEN p_to_status = 'CHECKED_OUT'::booking_status
    WHEN p_from_status = 'CHECKED_OUT'::booking_status THEN false  -- Final state
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get accessible bookings for user by role & branch
CREATE OR REPLACE FUNCTION fn_get_accessible_bookings_for_user(
  p_user_id UUID,
  p_user_role VARCHAR
)
RETURNS TABLE(booking_id UUID, customer_id UUID, room_id UUID, branch_id UUID, status booking_status) AS $$
BEGIN
  IF p_user_role = 'OWNER' THEN
    -- OWNER: all bookings across all branches
    RETURN QUERY
    SELECT b.id, b.customer_id, b.room_id, b.branch_id, b.status
    FROM bookings b
    ORDER BY b.created_at DESC;
  ELSE
    -- MANAGER/STAFF: only bookings for assigned branches
    RETURN QUERY
    SELECT b.id, b.customer_id, b.room_id, b.branch_id, b.status
    FROM bookings b
    INNER JOIN user_branch_assignments uba ON b.branch_id = uba.branch_id
    WHERE uba.user_id = p_user_id
    ORDER BY b.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 6: MAINTENANCE & CLEANUP PROCEDURES
   ═══════════════════════════════════════════════════════════════════════════════ */

-- Procedure: Monthly maintenance (clean old tokens, expire old bookings, archive logs)
CREATE OR REPLACE PROCEDURE sp_monthly_maintenance()
AS $$
DECLARE
  v_cleaned_tokens int;
  v_expired_result RECORD;
BEGIN
  -- Clean expired verification tokens
  SELECT fn_cleanup_expired_tokens() INTO v_cleaned_tokens;
  INSERT INTO permission_audit_logs(user_id, action, old_value, new_value, changed_by, change_reason, created_at)
  VALUES(NULL, 'CLEANUP_TOKENS', NULL, jsonb_build_object('deleted_tokens', v_cleaned_tokens)::text, NULL, 'sp_monthly_maintenance', CURRENT_TIMESTAMP);

  -- Auto-expire old bookings
  SELECT * INTO v_expired_result FROM fn_auto_expire_bookings();
  INSERT INTO permission_audit_logs(user_id, action, old_value, new_value, changed_by, change_reason, created_at)
  VALUES(NULL, 'AUTO_EXPIRE_BOOKINGS', NULL, jsonb_build_object('expired_count', v_expired_result.expired_count, 'cancelled_count', v_expired_result.cancelled_count)::text, NULL, 'sp_monthly_maintenance', CURRENT_TIMESTAMP);

  COMMIT;
END;
$$ LANGUAGE plpgsql;

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 7: MIGRATION DATA (if needed)
   ═══════════════════════════════════════════════════════════════════════════════ */

-- Note: Verification tokens and permission audit logs are initialized empty.
-- Existing token/verification data should be migrated from MongoDB in separate migration if needed.
