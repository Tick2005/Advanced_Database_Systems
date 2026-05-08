-- Add optimistic locking support to bookings table
-- This allows detecting concurrent modifications and preventing double-booking

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;

-- Create indexes for frequently queried booking statuses
CREATE INDEX IF NOT EXISTS idx_bookings_status_checkin 
  ON bookings(status, check_in_date) WHERE status IN ('CONFIRMED', 'CHECKED_IN');

CREATE INDEX IF NOT EXISTS idx_bookings_room_date_range 
  ON bookings(room_id, check_in_date, check_out_date) WHERE status NOT IN ('CANCELLED');

-- MongoDB sessions table (for persistence, separate from application-level TTL)
-- This is created at initialization but documented here for reference
-- Collections: sessions, verification_tokens, activity_logs, feedbacks, customer_settings
