CREATE OR REPLACE VIEW v_branch_hierarchy_cte AS
WITH RECURSIVE branch_tree AS (
	SELECT
		b.id,
		b.parent_branch_id,
		b.code,
		b.name,
		b.country,
		b.city,
		b.timezone,
		b.is_active,
		1 AS depth,
		b.name::TEXT AS path_name
	FROM branches b
	WHERE b.parent_branch_id IS NULL

	UNION ALL

	SELECT
		child.id,
		child.parent_branch_id,
		child.code,
		child.name,
		child.country,
		child.city,
		child.timezone,
		child.is_active,
		parent.depth + 1 AS depth,
		CONCAT(parent.path_name, ' > ', child.name) AS path_name
	FROM branches child
	JOIN branch_tree parent ON parent.id = child.parent_branch_id
)
SELECT *
FROM branch_tree;

CREATE OR REPLACE VIEW v_room_rating_snapshot_cte AS
WITH room_stats AS (
	SELECT
		r.id AS room_id,
		r.room_type_id,
		r.room_number,
		r.status,
		r.rate,
		r.average_rating,
		r.updated_at,
		rt.branch_id,
		rt.name AS room_type_name,
		b.name AS branch_name,
		b.city AS branch_city,
		ROW_NUMBER() OVER (
			PARTITION BY rt.branch_id
			ORDER BY r.average_rating DESC, r.rate DESC, r.updated_at DESC
		) AS branch_rank
	FROM rooms r
	JOIN room_types rt ON rt.id = r.room_type_id
	JOIN branches b ON b.id = rt.branch_id
	WHERE rt.is_active = TRUE
	  AND b.is_active = TRUE
),
branch_summary AS (
	SELECT
		branch_id,
		COUNT(*) AS room_count,
		COALESCE(AVG(average_rating),0)::NUMERIC(3, 2) AS avg_branch_rating,
		SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_room_count
	FROM room_stats
	GROUP BY branch_id
)
SELECT
	rs.room_id,
	rs.room_type_id,
	rs.room_number,
	rs.status,
	rs.rate,
	rs.average_rating,
	rs.updated_at,
	rs.branch_id,
	rs.room_type_name,
	rs.branch_name,
	rs.branch_city,
	rs.branch_rank,
	bs.room_count,
	bs.avg_branch_rating,
	bs.available_room_count
FROM room_stats rs
JOIN branch_summary bs ON bs.branch_id = rs.branch_id;

CREATE OR REPLACE VIEW v_booking_revenue_cte AS
WITH monthly_bookings AS (
	SELECT
		b.branch_id,
		DATE_TRUNC('month', b.created_at)::DATE AS revenue_month,
		COUNT(*) AS booking_count,
		SUM(b.total_price) AS total_revenue,
		COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_booking_count,
		COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS cancelled_booking_count
	FROM bookings b
	GROUP BY b.branch_id, DATE_TRUNC('month', b.created_at)::DATE
)
SELECT
	mb.branch_id,
	b.name AS branch_name,
	b.city AS branch_city,
	mb.revenue_month,
	mb.booking_count,
	mb.total_revenue,
	mb.confirmed_booking_count,
	mb.cancelled_booking_count
FROM monthly_bookings mb
JOIN branches b ON b.id = mb.branch_id;
