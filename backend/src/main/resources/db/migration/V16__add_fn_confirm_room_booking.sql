-- V16: Add payment confirmation function used by PaymentService
-- This restores DB-side booking/payment consistency when VNPay callbacks are processed.

CREATE OR REPLACE FUNCTION fn_confirm_room_booking(
  p_booking_id UUID,
  p_transaction_ref VARCHAR,
  p_provider VARCHAR,
  p_currency VARCHAR,
  p_raw_payload JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_room_id UUID;
BEGIN
  UPDATE payments
  SET status = 'SUCCESS',
      transaction_ref = COALESCE(NULLIF(p_transaction_ref, ''), transaction_ref),
      provider = COALESCE(NULLIF(p_provider, ''), provider),
      currency = COALESCE(NULLIF(p_currency, ''), currency),
      paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
      raw_payload = COALESCE(p_raw_payload, raw_payload),
      updated_at = CURRENT_TIMESTAMP
  WHERE booking_id = p_booking_id;

  UPDATE bookings
  SET status = 'CONFIRMED',
      confirmed_at = COALESCE(confirmed_at, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_booking_id
    AND status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED');

  SELECT room_id INTO v_room_id FROM bookings WHERE id = p_booking_id;
  IF v_room_id IS NOT NULL THEN
    UPDATE rooms
    SET status = 'OCCUPIED',
        current_booking_id = p_booking_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_room_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;