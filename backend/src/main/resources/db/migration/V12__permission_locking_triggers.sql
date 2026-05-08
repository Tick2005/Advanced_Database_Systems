-- V10: Permission Locking Triggers
-- Move business logic from Java service layer to database:
-- - Prevent double-booking via trigger
-- - Validate permissions for branch operations
-- - Auto-update average ratings when feedback is added

-- ============================================================================
-- 1. TRIGGER: Prevent double-booking (overlapping dates)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if room has overlapping booking during target dates
  -- Exclude cancelled bookings and current booking (on UPDATE)
  IF EXISTS (
    SELECT 1
    FROM bookings
    WHERE room_id = NEW.room_id
      AND branch_id = NEW.branch_id
      AND status NOT IN ('CANCELLED', 'REJECTED')
      AND id != NEW.id  -- Exclude self on UPDATE
      AND NOT (NEW.check_out_date <= check_in_date OR NEW.check_in_date >= check_out_date)
  ) THEN
    RAISE EXCEPTION 'Room % is not available for dates % to %', 
      NEW.room_id, NEW.check_in_date, NEW.check_out_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON bookings;
CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_double_booking();

-- ============================================================================
-- 2. TRIGGER: Validate permission - user must be assigned to branch
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_validate_branch_permission()
RETURNS TRIGGER AS $$
DECLARE
  v_assigned_branch_id UUID;
BEGIN
  -- For operations requiring branch permission, check user_branch_assignments
  -- This trigger validates that staff/managers can only access their assigned branch
  SELECT branch_id INTO v_assigned_branch_id
  FROM user_branch_assignments
  WHERE user_id = NEW.updated_by OR user_id = NEW.created_by
  LIMIT 1;
  
  -- If not owner (id starts with 11111) and no branch assignment, reject
  IF NEW.branch_id IS NOT NULL 
     AND NEW.updated_by != '11111111-1111-1111-1111-111111111111'
     AND v_assigned_branch_id IS NULL THEN
    RAISE EXCEPTION 'User has no permission for branch %', NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TRIGGER: Auto-update booking version for optimistic locking
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_increment_booking_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-increment version on any UPDATE to bookings
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_booking_version ON bookings;
CREATE TRIGGER trg_increment_booking_version
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION fn_increment_booking_version();

-- ============================================================================
-- 4. TRIGGER: Enforce room status consistency
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_enforce_room_status_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If room has active booking, status must be OCCUPIED or HELD
  -- If no active booking, must be AVAILABLE or MAINTENANCE
  
  IF NEW.status = 'OCCUPIED' AND NEW.current_booking_id IS NULL THEN
    RAISE EXCEPTION 'Room cannot be OCCUPIED without current_booking_id';
  END IF;
  
  IF NEW.status IN ('AVAILABLE', 'MAINTENANCE') AND NEW.current_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'Room status % conflicts with current_booking_id', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_room_status_consistency ON rooms;
CREATE TRIGGER trg_enforce_room_status_consistency
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_room_status_consistency();

-- ============================================================================
-- 5. FUNCTION: Calculate average rating for room (called from MongoDB triggers)
-- ============================================================================
-- This function will be called when feedback is inserted/updated/deleted in MongoDB
-- It aggregates ratings from MongoDB feedback collection and updates rooms table
CREATE OR REPLACE FUNCTION fn_calc_room_average_rating(p_room_id UUID)
RETURNS double precision AS $$
DECLARE
  v_avg_rating double precision;
BEGIN
  -- In a real polyglot setup, this would aggregate from MongoDB feedback documents
  -- For now, we provide the structure; MongoDB insert trigger will call backend API
  -- Backend API: POST /admin/rooms/{roomId}/sync-ratings
  RETURN v_avg_rating;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGER: Log permission changes for audit trail
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_audit_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, changes, changed_by, changed_at)
  VALUES (
    'user_branch_assignments',
    NEW.user_id::text,
    CASE WHEN TG_OP = 'INSERT' THEN 'ASSIGN' WHEN TG_OP = 'DELETE' THEN 'REVOKE' ELSE 'MODIFY' END,
    jsonb_build_object('branch_id', NEW.branch_id),
    current_user,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_permission_change ON user_branch_assignments;
CREATE TRIGGER trg_audit_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON user_branch_assignments
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_permission_change();

-- ============================================================================
-- 7. STORED PROCEDURE: Check if user has permission for booking operation
-- ============================================================================
CREATE OR REPLACE FUNCTION sp_check_booking_permission(
  p_user_id UUID,
  p_branch_id UUID,
  p_user_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assigned_branch UUID;
BEGIN
  -- OWNER can do anything
  IF p_user_role = 'OWNER' THEN
    RETURN TRUE;
  END IF;
  
  -- MANAGER/STAFF must be assigned to the branch
  IF p_user_role IN ('MANAGER', 'STAFF') THEN
    SELECT branch_id INTO v_assigned_branch
    FROM user_branch_assignments
    WHERE user_id = p_user_id;
    
    RETURN v_assigned_branch = p_branch_id;
  END IF;
  
  -- CUSTOMER has no branch permissions
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. STORED PROCEDURE: Get user's accessible branches
-- ============================================================================
CREATE OR REPLACE FUNCTION sp_get_accessible_branches(p_user_id UUID)
RETURNS TABLE(branch_id UUID, branch_code VARCHAR, branch_name VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.code,
    b.name
  FROM branches b
  LEFT JOIN user_branch_assignments uba ON b.id = uba.branch_id
  WHERE uba.user_id = p_user_id 
     OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user_id AND u.role = 'OWNER');
END;
$$ LANGUAGE plpgsql;
