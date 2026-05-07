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

CREATE OR REPLACE VIEW v_top_rooms_by_rating AS
SELECT
	r.id AS room_id,
	r.room_number,
	r.average_rating,
	r.rate,
	r.status,
	r.max_occupancy,
	rt.id AS room_type_id,
	rt.name AS room_type_name,
	b.id AS branch_id,
	b.name AS branch_name,
	b.city AS branch_city
FROM rooms r
JOIN room_types rt ON rt.id = r.room_type_id
JOIN branches b ON b.id = rt.branch_id
WHERE rt.is_active = TRUE
  AND b.is_active = TRUE
ORDER BY r.average_rating DESC, r.updated_at DESC;
