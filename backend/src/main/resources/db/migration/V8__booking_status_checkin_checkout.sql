DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'booking_status' AND n.nspname = 'public'
    ) THEN
        BEGIN
            ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CHECKED_IN';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CHECKED_OUT';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
