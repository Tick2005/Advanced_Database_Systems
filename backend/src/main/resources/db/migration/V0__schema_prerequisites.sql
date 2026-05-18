-- V0: Schema Prerequisites - Define custom types and extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create all required ENUM types
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
		CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'MANAGER', 'OWNER');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
		CREATE TYPE room_status AS ENUM ('AVAILABLE', 'HELD', 'OCCUPIED', 'MAINTENANCE');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
		CREATE TYPE booking_status AS ENUM ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
		CREATE TYPE payment_status AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_mode') THEN
		CREATE TYPE service_mode AS ENUM ('PREBOOK', 'ON_SITE', 'BOTH');
	END IF;
END $$;
