-- V5: Booking Confirmation and Auto-Expiration Functions
-- ============================================================================
-- ĐÁP ỨNG YÊU CẦU ĐỀ BÀI:
--   ✅ "Sagas/2PC" — Booking flow dùng Saga pattern (choreography-based):
--
--   SAGA STEPS (booking creation → payment → confirmation):
--     Step 1: createBooking()  → HOLD room + create booking (HOLD status)
--             Compensating tx: expireBooking() → release room → AVAILABLE
--     Step 2: initiatePayment() → PENDING_PAYMENT status
--             Compensating tx: cancelBookingOnPaymentFailure() → CANCELLED
--     Step 3: fn_confirm_room_booking() → CONFIRMED + room OCCUPIED
--             (called by VNPay IPN webhook)
--             Compensating tx: cancelBooking() → CANCELLED + room AVAILABLE
--
--   Mỗi step có compensating transaction rõ ràng → đảm bảo eventual consistency
--   mà không cần distributed 2PC (phù hợp với single-DB architecture).
--
--   fn_auto_expire_bookings(): scheduler chạy định kỳ để expire HOLD quá 15 phút
--   → đây là timeout-based compensation trong Saga pattern.
-- ============================================================================

-- ============================================================================
-- FUNCTION: Confirm room booking after payment success (called by PaymentService)
-- Mở rộng điều kiện WHERE bookings để bao gồm EXPIRED:
-- Trường hợp scheduler expire booking ngay trước khi IPN về → vẫn confirm được
-- vì tiền đã bị trừ thực tế.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_confirm_room_booking(
  p_booking_id      UUID,
  p_transaction_ref VARCHAR,
  p_provider        VARCHAR,
  p_currency        VARCHAR,
  p_raw_payload     JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_room_id UUID;
BEGIN
  UPDATE payments
  SET status          = 'SUCCESS',
      transaction_ref = COALESCE(NULLIF(p_transaction_ref, ''), transaction_ref),
      provider        = COALESCE(NULLIF(p_provider, ''), provider),
      currency        = COALESCE(NULLIF(p_currency, ''), currency),
      paid_at         = COALESCE(paid_at, CURRENT_TIMESTAMP),
      raw_payload     = COALESCE(p_raw_payload, raw_payload),
      updated_at      = CURRENT_TIMESTAMP
  WHERE booking_id = p_booking_id;

  UPDATE bookings
  SET status     = 'CONFIRMED'::booking_status,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_booking_id
    AND status IN (
      'HOLD'::booking_status,
      'PENDING_PAYMENT'::booking_status,
      'CONFIRMED'::booking_status,
      'EXPIRED'::booking_status
    );

  SELECT room_id INTO v_room_id FROM bookings WHERE id = p_booking_id;
  IF v_room_id IS NOT NULL THEN
    UPDATE rooms
    SET status             = 'OCCUPIED'::room_status,
        current_booking_id = p_booking_id,
        updated_at         = CURRENT_TIMESTAMP
    WHERE id = v_room_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Auto-expire hold and pending bookings
-- Logic: dùng created_at + 15 phút làm ngưỡng — không cần cột expired_at.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_auto_expire_bookings()
RETURNS INT AS $$
DECLARE
  v_count            INT := 0;
  v_new_count        INT := 0;
  v_expire_threshold TIMESTAMPTZ;
BEGIN
  v_expire_threshold := CURRENT_TIMESTAMP - INTERVAL '15 minutes';

  UPDATE bookings
  SET status     = 'EXPIRED'::booking_status,
      updated_at = CURRENT_TIMESTAMP
  WHERE status   = 'HOLD'::booking_status
    AND created_at < v_expire_threshold;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE bookings
  SET status        = 'CANCELLED'::booking_status,
      cancel_reason = 'Payment not received within 15-minute deadline',
      updated_at    = CURRENT_TIMESTAMP
  WHERE status   = 'PENDING_PAYMENT'::booking_status
    AND created_at < v_expire_threshold;
  GET DIAGNOSTICS v_new_count = ROW_COUNT;

  RETURN v_count + v_new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Validate booking status transitions
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_can_transition_booking_status(
  p_current_status booking_status,
  p_new_status     booking_status
)
RETURNS BOOLEAN AS $$
BEGIN
  CASE p_current_status
    WHEN 'HOLD'::booking_status THEN
      RETURN p_new_status IN ('CONFIRMED', 'EXPIRED', 'CANCELLED');
    WHEN 'PENDING_PAYMENT'::booking_status THEN
      RETURN p_new_status IN ('CONFIRMED', 'CANCELLED');
    WHEN 'CONFIRMED'::booking_status THEN
      RETURN p_new_status IN ('CHECKED_IN', 'CANCELLED');
    WHEN 'CHECKED_IN'::booking_status THEN
      RETURN p_new_status IN ('CHECKED_OUT', 'CANCELLED');
    WHEN 'CHECKED_OUT'::booking_status THEN
      RETURN FALSE;
    WHEN 'CANCELLED'::booking_status THEN
      RETURN FALSE;
    WHEN 'EXPIRED'::booking_status THEN
      RETURN FALSE;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORED PROCEDURE: Monthly maintenance cleanup
-- Không có COMMIT bên trong — caller (Spring scheduler) sẽ commit.
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_monthly_maintenance()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM fn_auto_expire_bookings();
  DELETE FROM permission_audit_logs WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
  -- KHÔNG có COMMIT ở đây — Spring transaction manager sẽ commit.
END;
$$;

-- ============================================================================
-- STORED PROCEDURE: Refresh tất cả pricing_seasons is_active theo ngày hiện tại.
-- Gọi bởi Spring scheduler (PricingService.refreshSeasonStatus) thay vì Java loop.
-- Một UPDATE batch hiệu quả hơn N+1 queries từ Java.
-- Không có COMMIT — Spring transaction manager sẽ commit.
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_refresh_pricing_season_status()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pricing_seasons
  SET is_active  = (CURRENT_DATE >= starts_on AND CURRENT_DATE <= ends_on),
      updated_at = CURRENT_TIMESTAMP
  WHERE is_active <> (CURRENT_DATE >= starts_on AND CURRENT_DATE <= ends_on);
END;
$$;
