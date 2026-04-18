CREATE OR REPLACE VIEW v_branch_tree AS
WITH RECURSIVE branch_cte AS (
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
		c.id,
		c.parent_branch_id,
		c.code,
		c.name,
		c.country,
		c.city,
		c.timezone,
		c.is_active,
		p.depth + 1,
		CONCAT(p.path_name, ' > ', c.name)
	FROM branches c
	JOIN branch_cte p ON p.id = c.parent_branch_id
)
SELECT * FROM branch_cte;

CREATE OR REPLACE VIEW v_branch_cover_image AS
SELECT DISTINCT ON (bi.branch_id)
	bi.branch_id,
	bi.image_url,
	bi.alt_text,
	bi.is_cover,
	bi.sort_order
FROM branch_images bi
ORDER BY bi.branch_id, bi.is_cover DESC, bi.sort_order ASC, bi.created_at ASC;

CREATE OR REPLACE VIEW v_public_room_showcase AS
SELECT
	rt.id AS room_type_id,
	rt.branch_id,
	b.name AS branch_name,
	b.city AS branch_city,
	rt.code,
	rt.name,
	rt.slug,
	rt.base_price,
	rt.capacity,
	rt.bed_type,
	rt.amenities,
	rt.average_rating,
	rt.review_count,
	rt.is_featured,
	COALESCE(available_rooms.available_count, 0) AS available_room_count,
	cover.image_url AS cover_image_url
FROM room_types rt
JOIN branches b ON b.id = rt.branch_id
LEFT JOIN (
	SELECT r.room_type_id, COUNT(*) AS available_count
	FROM rooms r
	WHERE r.status = 'AVAILABLE'
	GROUP BY r.room_type_id
) available_rooms ON available_rooms.room_type_id = rt.id
LEFT JOIN (
	SELECT DISTINCT ON (rti.room_type_id)
		rti.room_type_id,
		rti.image_url
	FROM room_type_images rti
	ORDER BY rti.room_type_id, rti.is_cover DESC, rti.sort_order ASC, rti.created_at ASC
) cover ON cover.room_type_id = rt.id
WHERE rt.is_active = TRUE
  AND b.is_active = TRUE;

CREATE OR REPLACE VIEW v_room_showcase AS
SELECT
	r.id AS room_id,
	r.room_number,
	r.floor,
	r.status,
	r.rate,
	r.max_occupancy,
	rt.id AS room_type_id,
	rt.name AS room_type_name,
	rt.slug AS room_type_slug,
	rt.capacity AS room_type_capacity,
	b.id AS branch_id,
	b.name AS branch_name,
	b.city AS branch_city
FROM rooms r
JOIN room_types rt ON rt.id = r.room_type_id
JOIN branches b ON b.id = rt.branch_id;

CREATE OR REPLACE VIEW v_service_showcase AS
SELECT
	s.id AS service_id,
	s.branch_id,
	b.name AS branch_name,
	s.code,
	s.name,
	s.description,
	s.thumbnail_url,
	s.price,
	s.service_mode,
	s.is_active
FROM services s
JOIN branches b ON b.id = s.branch_id
WHERE s.is_active = TRUE
  AND b.is_active = TRUE;

CREATE OR REPLACE VIEW v_room_type_profit_ranked AS
WITH room_type_revenue AS (
	SELECT
		rt.id AS room_type_id,
		rt.branch_id,
		DATE_TRUNC('quarter', bkg.created_at)::DATE AS revenue_quarter,
		SUM(bkg.total_price) AS total_revenue
	FROM bookings bkg
	JOIN rooms r ON r.id = bkg.room_id
	JOIN room_types rt ON rt.id = r.room_type_id
	WHERE bkg.status = 'CONFIRMED'
	GROUP BY rt.id, rt.branch_id, DATE_TRUNC('quarter', bkg.created_at)::DATE
)
SELECT
	rtr.room_type_id,
	rtr.branch_id,
	rtr.revenue_quarter,
	rtr.total_revenue,
	DENSE_RANK() OVER (
		PARTITION BY rtr.branch_id, rtr.revenue_quarter
		ORDER BY rtr.total_revenue DESC
	) AS profit_rank
FROM room_type_revenue rtr;

CREATE OR REPLACE VIEW v_top_room_types_by_profit AS
SELECT
	v.room_type_id,
	rt.name AS room_type_name,
	v.branch_id,
	b.name AS branch_name,
	v.revenue_quarter,
	v.total_revenue,
	v.profit_rank
FROM v_room_type_profit_ranked v
JOIN room_types rt ON rt.id = v.room_type_id
JOIN branches b ON b.id = v.branch_id
WHERE v.profit_rank <= 3;

CREATE OR REPLACE VIEW v_room_revenue_by_quarter AS
SELECT
	r.id AS room_id,
	rt.branch_id,
	DATE_TRUNC('quarter', bkg.created_at)::DATE AS revenue_quarter,
	SUM(bkg.total_price) AS total_revenue,
	COUNT(*) AS booking_count
FROM bookings bkg
JOIN rooms r ON r.id = bkg.room_id
JOIN room_types rt ON rt.id = r.room_type_id
WHERE bkg.status = 'CONFIRMED'
GROUP BY r.id, rt.branch_id, DATE_TRUNC('quarter', bkg.created_at)::DATE;

CREATE OR REPLACE VIEW v_top_3_revenue_rooms_per_branch_quarter AS
WITH ranked_rooms AS (
	SELECT
		vr.room_id,
		vr.branch_id,
		vr.revenue_quarter,
		vr.total_revenue,
		DENSE_RANK() OVER (
			PARTITION BY vr.branch_id, vr.revenue_quarter
			ORDER BY vr.total_revenue DESC
		) AS revenue_rank
	FROM v_room_revenue_by_quarter vr
)
SELECT
	rr.room_id,
	rr.branch_id,
	b.name AS branch_name,
	rr.revenue_quarter,
	rr.total_revenue,
	rr.revenue_rank
FROM ranked_rooms rr
JOIN branches b ON b.id = rr.branch_id
WHERE rr.revenue_rank <= 3;

CREATE OR REPLACE VIEW v_branch_dashboard_summary AS
SELECT
	b.id AS branch_id,
	b.name AS branch_name,
	b.city AS branch_city,
	COUNT(DISTINCT rt.id) AS room_type_count,
	COUNT(DISTINCT r.id) AS room_count,
	COUNT(DISTINCT CASE WHEN r.status = 'AVAILABLE' THEN r.id END) AS available_room_count,
	COUNT(DISTINCT CASE WHEN bkg.status = 'CONFIRMED' THEN bkg.id END) AS confirmed_booking_count,
	COALESCE(SUM(CASE WHEN bkg.status = 'CONFIRMED' THEN bkg.total_price ELSE 0 END), 0) AS total_revenue
FROM branches b
LEFT JOIN room_types rt ON rt.branch_id = b.id
LEFT JOIN rooms r ON r.room_type_id = rt.id
LEFT JOIN bookings bkg ON bkg.branch_id = b.id
GROUP BY b.id, b.name, b.city;

