-- Create function to get top rooms by location or rating
-- Case 1: No location → sort by average_rating DESC
-- Case 2: With location → sort by distance ASC, then average_rating DESC

CREATE OR REPLACE FUNCTION get_top_rooms_by_location(
  p_user_latitude DOUBLE PRECISION DEFAULT NULL,
  p_user_longitude DOUBLE PRECISION DEFAULT NULL,
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  room_id UUID,
  room_number VARCHAR,
  average_rating DOUBLE PRECISION,
  rate NUMERIC,
  status VARCHAR,
  max_occupancy INT,
  room_type_id UUID,
  room_type_name VARCHAR,
  branch_id UUID,
  branch_name VARCHAR,
  branch_city VARCHAR,
  branch_latitude DOUBLE PRECISION,
  branch_longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.room_number,
    r.average_rating,
    r.rate,
    r.status::VARCHAR,
    r.max_occupancy,
    rt.id,
    rt.name,
    b.id,
    b.name,
    b.city,
    b.latitude,
    b.longitude,
    CASE
      WHEN p_user_latitude IS NOT NULL AND p_user_longitude IS NOT NULL
      THEN (6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((b.latitude - p_user_latitude) / 2)), 2) +
        COS(RADIANS(p_user_latitude)) * COS(RADIANS(b.latitude)) *
        POWER(SIN(RADIANS((b.longitude - p_user_longitude) / 2)), 2)
      )))::DOUBLE PRECISION
      ELSE NULL::DOUBLE PRECISION
    END as distance_km
  FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id
  JOIN branches b ON b.id = rt.branch_id
  WHERE rt.is_active = TRUE
    AND b.is_active = TRUE
  ORDER BY
    CASE
      WHEN p_user_latitude IS NOT NULL AND p_user_longitude IS NOT NULL
      THEN (6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((b.latitude - p_user_latitude) / 2)), 2) +
        COS(RADIANS(p_user_latitude)) * COS(RADIANS(b.latitude)) *
        POWER(SIN(RADIANS((b.longitude - p_user_longitude) / 2)), 2)
      )))
      ELSE 99999
    END ASC,
    r.average_rating DESC,
    r.updated_at DESC
  LIMIT COALESCE(p_limit, 4);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create index on branches for faster location queries
CREATE INDEX IF NOT EXISTS idx_branches_coordinates
  ON branches (latitude, longitude)
  WHERE is_active = TRUE;

-- Create index on rooms for rating and status
CREATE INDEX IF NOT EXISTS idx_rooms_rating_status
  ON rooms (average_rating DESC, status)
  WHERE status != 'INACTIVE';
