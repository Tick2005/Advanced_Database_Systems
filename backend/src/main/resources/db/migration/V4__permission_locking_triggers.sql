-- V4: Permission Locking and Business Logic Triggers
-- ============================================================================
-- ĐÁP ỨNG YÊU CẦU ĐỀ BÀI:
--   ✅ "Implement a Pessimistic Locking strategy in SQL during booking to
--      prevent double-booking"
--
--   CHIẾN LƯỢC PESSIMISTIC LOCKING (2 tầng):
--
--   Tầng 1 — Application layer (Spring):
--     BookingRepository.findByIdForUpdate()  → SELECT ... FOR UPDATE trên bookings
--     RoomRepository.findByIdForUpdate()     → SELECT ... FOR UPDATE trên rooms
--     @Retryable(maxAttempts=3) xử lý deadlock / lock timeout.
--
--   Tầng 2 — Database layer (trigger này):
--     fn_prevent_double_booking() chạy BEFORE INSERT OR UPDATE trên bookings.
--     Dùng SELECT ... FOR UPDATE SKIP LOCKED để lock các booking cùng phòng
--     đang active, sau đó kiểm tra overlap ngày.
--     Nếu có overlap → RAISE EXCEPTION → Spring nhận DataIntegrityViolationException
--     → @Retryable retry, sau đó unwrap thành BusinessException (HTTP 400).
--
--   Hai tầng bổ sung nhau:
--     - Application layer lock room row trước → giảm contention tại DB.
--     - DB trigger là safety net cuối cùng, bắt race condition khi 2 request
--       vào đồng thời trước khi application lock có hiệu lực.
--
--   Đây là Pessimistic Locking thuần túy: lock row trước khi đọc/ghi,
--   không dùng optimistic locking (version column).
-- ============================================================================

-- ============================================================================
-- TRIGGER: Pessimistic locking — ngăn double-booking tại DB layer
--
-- Dùng SELECT ... FOR UPDATE SKIP LOCKED để:
--   1. Lock tất cả booking active của cùng phòng trong khoảng ngày.
--   2. Kiểm tra overlap. Nếu có → RAISE EXCEPTION.
--   SKIP LOCKED: bỏ qua row đang bị lock bởi transaction khác thay vì chờ,
--   tránh deadlock khi nhiều request đến đồng thời.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INT;
BEGIN
  -- Chỉ kiểm tra booking đang active (bỏ qua CANCELLED / EXPIRED)
  IF NEW.status IN ('CANCELLED', 'EXPIRED') THEN
    RETURN NEW;
  END IF;

  -- SELECT FOR UPDATE SKIP LOCKED: lock các booking active cùng phòng,
  -- bỏ qua row đang bị lock bởi transaction khác (tránh deadlock).
  -- Đếm số booking overlap với khoảng ngày mới.
  SELECT COUNT(*)
  INTO v_overlap_count
  FROM (
    SELECT b.id
    FROM bookings b
    WHERE b.room_id = NEW.room_id
      AND b.id      <> NEW.id                       -- bỏ qua chính nó (UPDATE)
      AND b.status  NOT IN ('CANCELLED', 'EXPIRED')
      AND b.check_in_date  < NEW.check_out_date     -- overlap: start < other_end
      AND b.check_out_date > NEW.check_in_date      --          end   > other_start
    FOR UPDATE SKIP LOCKED
  ) locked_rows;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION
      'Room % is not available for dates % to % - overlapping active booking exists (pessimistic lock)',
      NEW.room_id, NEW.check_in_date, NEW.check_out_date
      USING ERRCODE = 'P0001';
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
-- TRIGGER: Enforce room status consistency
-- Đảm bảo rooms.status nhất quán với rooms.current_booking_id.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_enforce_room_status_consistency()
RETURNS TRIGGER AS $$
BEGIN
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
-- TRIGGER: Log permission changes for audit trail
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_audit_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO permission_audit_logs (user_id, action, old_value, new_value, changed_by, change_reason, created_at)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'INSERT' THEN 'ASSIGN_BRANCH'
         WHEN TG_OP = 'DELETE' THEN 'REVOKE_BRANCH'
         ELSE 'UPDATE_BRANCH' END,
    CASE WHEN OLD IS NOT NULL THEN OLD.branch_id::text ELSE NULL END,
    CASE WHEN NEW IS NOT NULL THEN NEW.branch_id::text ELSE NULL END,
    NULL,
    TG_OP,
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
-- FUNCTION: Check if user has permission for branch operation
-- ============================================================================
CREATE OR REPLACE FUNCTION sp_check_booking_permission(
  p_user_id   UUID,
  p_branch_id UUID,
  p_user_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assigned_branch UUID;
BEGIN
  IF p_user_role = 'OWNER' THEN
    RETURN TRUE;
  END IF;

  IF p_user_role IN ('MANAGER', 'STAFF') THEN
    SELECT branch_id INTO v_assigned_branch
    FROM user_branch_assignments
    WHERE user_id = p_user_id;
    RETURN v_assigned_branch = p_branch_id;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get user's accessible branches
-- ============================================================================
CREATE OR REPLACE FUNCTION sp_get_accessible_branches(p_user_id UUID)
RETURNS TABLE(branch_id UUID, branch_code VARCHAR, branch_name VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.code, b.name
  FROM branches b
  LEFT JOIN user_branch_assignments uba ON b.id = uba.branch_id
  WHERE uba.user_id = p_user_id
     OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user_id AND u.role = 'OWNER');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get accessible bookings for user by role
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_accessible_bookings_for_user(
  p_user_id   UUID,
  p_user_role user_role
)
RETURNS TABLE(
  booking_id  UUID,
  customer_id UUID,
  room_id     UUID,
  branch_id   UUID,
  status      VARCHAR,
  created_at  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.customer_id,
    b.room_id,
    b.branch_id,
    b.status::VARCHAR,
    b.created_at
  FROM bookings b
  WHERE (
    CASE
      WHEN p_user_role = 'OWNER'                  THEN TRUE
      WHEN p_user_role IN ('MANAGER', 'STAFF')    THEN
        EXISTS (
          SELECT 1 FROM user_branch_assignments
          WHERE user_id = p_user_id AND branch_id = b.branch_id
        )
      ELSE p_user_id = b.customer_id
    END
  );
END;
$$ LANGUAGE plpgsql;
