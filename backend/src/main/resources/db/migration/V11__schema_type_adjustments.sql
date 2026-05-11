-- V11: Schema Type Adjustments
-- Fix numeric columns that should be floating point for proper JPA/Hibernate mapping

-- Adjust branches table columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'latitude' AND data_type = 'numeric'
  ) THEN
    ALTER TABLE branches ALTER COLUMN latitude TYPE double precision USING latitude::double precision;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'longitude' AND data_type = 'numeric'
  ) THEN
    ALTER TABLE branches ALTER COLUMN longitude TYPE double precision USING longitude::double precision;
  END IF;
END $$;
