-- V14: Add database-level booking exclusion constraint
-- Move concurrency check from Java to Postgres

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
) WHERE (status NOT IN ('CANCELLED', 'EXPIRED'));
