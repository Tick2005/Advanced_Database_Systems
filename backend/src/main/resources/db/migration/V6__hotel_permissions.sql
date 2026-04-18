DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_readonly') THEN
		CREATE ROLE hotel_readonly;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_readwrite') THEN
		CREATE ROLE hotel_readwrite;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hotel_app') THEN
		CREATE ROLE hotel_app;
	END IF;
END $$;

GRANT USAGE ON SCHEMA public TO hotel_readonly, hotel_readwrite, hotel_app;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_readonly;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hotel_readwrite;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hotel_readwrite;

GRANT hotel_readwrite TO hotel_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT SELECT ON TABLES TO hotel_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hotel_readwrite;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hotel_readwrite;

