DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_rooms_current_booking'
	) THEN
		ALTER TABLE rooms
			ADD CONSTRAINT fk_rooms_current_booking
			FOREIGN KEY (current_booking_id)
			REFERENCES bookings(id)
			ON DELETE SET NULL;
	END IF;
END $$;