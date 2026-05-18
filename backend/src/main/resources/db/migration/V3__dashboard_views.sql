-- V3: Dashboard Views and Branch Hierarchy
-- ============================================================================
-- ĐÁP ỨNG YÊU CẦU ĐỀ BÀI:
--   ✅ "Use SQL Window Functions to rank room performance within each hotel
--      based on revenue"
--   → v_room_performance_rank_by_hotel (cuối file):
--      RANK(), DENSE_RANK(), ROW_NUMBER(), PERCENT_RANK(), SUM() OVER()
--      tất cả đều PARTITION BY branch_id (= hotel)
--   ✅ "Recursive CTEs"
--   → v_branch_tree: WITH RECURSIVE branch_cte (cuối file)
--   → fn_get_branch_subtree(), fn_count_branch_subtree_rooms(),
--      fn_get_branch_revenue_subtree(): PL/pgSQL recursive functions
-- ============================================================================

-- ============================================================================
-- VIEW: Branch tree with hierarchy depth
-- ============================================================================
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

-- ============================================================================
-- VIEW: Branch cover image (distinct on branch, ordered by is_cover DESC)
-- ============================================================================
CREATE OR REPLACE VIEW v_branch_cover_image AS
SELECT DISTINCT ON (bi.branch_id)
	bi.branch_id,
	bi.image_url,
	bi.alt_text,
	bi.is_cover,
	bi.sort_order
FROM branch_images bi
ORDER BY bi.branch_id, bi.is_cover DESC, bi.sort_order ASC, bi.created_at ASC;

-- ============================================================================
-- VIEW: Booking summary with customer and room info for dashboard
-- ============================================================================
CREATE OR REPLACE VIEW v_booking_summary AS
SELECT
	b.id AS booking_id,
	b.customer_id,
	up.full_name AS customer_name,
	b.room_id,
	r.room_number,
	rt.name AS room_type_name,
	br.name AS branch_name,
	b.check_in_date,
	b.check_out_date,
	b.status AS booking_status,
	b.total_price,
	p.status AS payment_status,
	b.created_at
FROM bookings b
LEFT JOIN user_profiles up ON b.customer_id = up.user_id
LEFT JOIN rooms r ON b.room_id = r.id
LEFT JOIN room_types rt ON r.room_type_id = rt.id
LEFT JOIN branches br ON b.branch_id = br.id
LEFT JOIN payments p ON b.id = p.booking_id;

-- ============================================================================
-- VIEW: Room availability status
-- ============================================================================
CREATE OR REPLACE VIEW v_room_availability AS
SELECT
	r.id AS room_id,
	r.room_number,
	rt.name AS room_type_name,
	br.id AS branch_id,
	br.name AS branch_name,
	r.status,
	r.rate,
	r.average_rating,
	CASE
		WHEN r.status = 'OCCUPIED' THEN b.check_out_date
		ELSE NULL
	END AS check_out_date,
	r.max_occupancy
FROM rooms r
LEFT JOIN room_types rt ON r.room_type_id = rt.id
LEFT JOIN branches br ON rt.branch_id = br.id
LEFT JOIN bookings b ON r.current_booking_id = b.id;

-- ============================================================================
-- Dashboard metric views (aggregate for owner/manager/staff dashboards)
-- v_dashboard_overall_metrics: global metrics for owner
-- v_dashboard_branch_metrics: per-branch metrics for manager/staff
-- v_dashboard_daily_metrics: day-by-day summary for quick charts
-- ============================================================================

CREATE OR REPLACE VIEW v_dashboard_overall_metrics AS
SELECT
	(SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.status = 'SUCCESS') AS total_revenue,
	(SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED') AS total_confirmed_bookings,
	(SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED') AS total_cancelled_bookings,
	(SELECT COALESCE(AVG(total_price),0) FROM bookings WHERE status = 'CONFIRMED') AS avg_booking_value,
	-- Estimated profit: use conservative margin (30%) as placeholder for reporting
	ROUND( (SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.status = 'SUCCESS') * 0.30, 0) AS estimated_profit
;

CREATE OR REPLACE VIEW v_dashboard_branch_metrics AS
SELECT
	br.id AS branch_id,
	br.name AS branch_name,
	COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END),0) AS revenue,
	COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS confirmed_bookings,
	COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) AS cancelled_bookings,
	COALESCE(AVG(CASE WHEN b.status = 'CONFIRMED' THEN b.total_price ELSE NULL END),0) AS avg_booking_value,
	ROUND(COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END),0) * 0.30, 0) AS estimated_profit
FROM branches br
LEFT JOIN bookings b ON b.branch_id = br.id
LEFT JOIN payments p ON p.booking_id = b.id
GROUP BY br.id, br.name;

CREATE OR REPLACE VIEW v_dashboard_daily_metrics AS
SELECT
	date_trunc('day', b.created_at)::date AS day,
	COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_count,
	COUNT(*) FILTER (WHERE b.status IN ('HOLD','PENDING_PAYMENT')) AS pending_count,
	COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS cancelled_count,
	COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'),0) AS revenue
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
GROUP BY date_trunc('day', b.created_at)
ORDER BY day DESC;

-- Quick stats view for today's operations (useful for dashboard homepage)
CREATE OR REPLACE VIEW v_dashboard_today_quick_stats AS
SELECT
	CURRENT_DATE AS report_date,
	(SELECT COUNT(*) FROM bookings WHERE created_at::date = CURRENT_DATE) AS bookings_today,
	(SELECT COUNT(*) FROM bookings WHERE check_in_date = CURRENT_DATE AND status IN ('CONFIRMED','CHECKED_IN')) AS checkins_today,
	(SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.status = 'SUCCESS' AND b.created_at::date = CURRENT_DATE) AS revenue_today
;

-- ============================================================================
-- VIEW: KPI per branch — doanh thu, lợi nhuận, lấp đầy, nhân sự, feedback
-- Nguồn: bookings, payments, rooms, users (staff), room_types
-- Dùng bởi: DashboardService.getOwnerSummary() → kpiMetrics
-- ============================================================================
CREATE OR REPLACE VIEW v_kpi_branch_metrics AS
SELECT
    br.id                                                           AS branch_id,
    br.name                                                         AS branch_name,
    -- Doanh thu thực từ payments SUCCESS
    COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0)
                                                                    AS total_revenue,
    -- Chi phí vận hành = 70% doanh thu
    ROUND((COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0) * 0.70)::numeric, 0)
                                                                    AS operating_cost,
    -- Lợi nhuận ròng = 30% doanh thu
    ROUND((COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0) * 0.30)::numeric, 0)
                                                                    AS net_profit,
    -- Số booking confirmed/checked_in/checked_out
    COUNT(CASE WHEN b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') THEN 1 END)
                                                                    AS confirmed_bookings,
    -- Tỷ lệ lấp đầy: confirmed bookings / tổng phòng (0–100)
    CASE
        WHEN COUNT(DISTINCT r.id) = 0 THEN 0
        ELSE LEAST(100, ROUND(
            (COUNT(CASE WHEN b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') THEN 1 END)::NUMERIC
            / NULLIF(COUNT(DISTINCT r.id), 0) * 10)::numeric, 0
        ))
    END                                                             AS occupancy_score,
    -- Nhân sự: số staff được gán chi nhánh (0–100 scale, cap 10 staff = 100)
    LEAST(100, COALESCE(
        (SELECT COUNT(*) * 10 FROM user_branch_assignments uba2
         JOIN users u2 ON u2.id = uba2.user_id
         WHERE uba2.branch_id = br.id AND u2.role = 'STAFF'),
        0
    ))                                                              AS staff_score,
    -- Feedback CSKH: average rating aggregated from rooms (0–100 scale)
    ROUND(COALESCE(
        (
         SELECT AVG(r2.average_rating) * 20
         FROM rooms r2
         JOIN room_types rt2 ON r2.room_type_id = rt2.id
         WHERE rt2.branch_id = br.id AND r2.average_rating > 0
        ),
        0
    )::numeric, 0)                                                   AS csr_score
FROM branches br
LEFT JOIN bookings b  ON b.branch_id = br.id
LEFT JOIN payments p  ON p.booking_id = b.id
LEFT JOIN rooms    r  ON r.room_type_id IN (
    SELECT id FROM room_types WHERE branch_id = br.id
)
WHERE br.is_active = TRUE
GROUP BY br.id, br.name;

-- ============================================================================
-- VIEW: Doanh thu 6 tháng gần nhất theo từng chi nhánh (cho biểu đồ đường)
-- Nguồn: bookings, payments
-- Dùng bởi: DashboardService.getOwnerSummary() → branchRevenueSeries
-- ============================================================================
CREATE OR REPLACE VIEW v_branch_revenue_6months AS
SELECT
    br.id::TEXT                                                     AS branch_id,
    br.name                                                         AS branch_name,
    TO_CHAR(date_trunc('month', b.created_at), 'TMM/YYYY')         AS period,
    date_trunc('month', b.created_at)                              AS period_date,
    COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0)
                                                                    AS revenue
FROM branches br
JOIN bookings  b  ON b.branch_id = br.id
LEFT JOIN payments p ON p.booking_id = b.id
WHERE br.is_active = TRUE
  AND b.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
GROUP BY br.id, br.name, date_trunc('month', b.created_at)
ORDER BY br.name, period_date;

-- ReportService.java queries two views:
--   v_top_room_types_by_profit  → getTopRoomTypesByProfit()  → GET /api/owner/reports
--   v_room_revenue_by_quarter   → getRoomRevenueByQuarter()  (internal)
--
-- NOTE: RANK() window function cannot be used directly inside a GROUP BY
-- aggregate query in PostgreSQL. The aggregation must be done in a subquery
-- first, then RANK() is applied on top of the result.

-- ============================================================================
-- VIEW: Top room types by profit (all branches, quarterly)
-- Used by: ReportService.getTopRoomTypesByProfit() → GET /api/owner/reports
-- ============================================================================
CREATE OR REPLACE VIEW v_top_room_types_by_profit AS
SELECT
    agg.room_type_id,
    agg.room_type_name,
    agg.branch_id,
    agg.branch_name,
    agg.revenue_quarter,
    agg.total_revenue,
    RANK() OVER (
        PARTITION BY agg.revenue_quarter
        ORDER BY agg.total_revenue DESC
    ) AS profit_rank
FROM (
    SELECT
        rt.id::TEXT                                              AS room_type_id,
        rt.name                                                  AS room_type_name,
        br.id::TEXT                                              AS branch_id,
        br.name                                                  AS branch_name,
        date_trunc('quarter', b.created_at)::DATE               AS revenue_quarter,
        COALESCE(SUM(
            CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END
        ), 0)                                                    AS total_revenue
    FROM room_types rt
    JOIN branches   br ON br.id  = rt.branch_id
    JOIN rooms      r  ON r.room_type_id = rt.id
    JOIN bookings   b  ON b.room_id = r.id
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
    GROUP BY
        rt.id, rt.name,
        br.id, br.name,
        date_trunc('quarter', b.created_at)
) agg;

-- ============================================================================
-- VIEW: Room revenue by quarter (per room, all branches)
-- Used by: ReportService.getRoomRevenueByQuarter()
-- ============================================================================
CREATE OR REPLACE VIEW v_room_revenue_by_quarter AS
SELECT
    r.id::TEXT                                                   AS room_id,
    br.id::TEXT                                                  AS branch_id,
    date_trunc('quarter', b.created_at)::DATE                   AS revenue_quarter,
    COALESCE(SUM(
        CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END
    ), 0)                                                        AS total_revenue,
    COUNT(b.id)                                                  AS booking_count
FROM rooms    r
JOIN room_types rt ON rt.id = r.room_type_id
JOIN branches   br ON br.id = rt.branch_id
JOIN bookings   b  ON b.room_id = r.id
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
GROUP BY
    r.id,
    br.id,
    date_trunc('quarter', b.created_at);

-- ============================================================================
-- FUNCTION: fn_get_branch_subtree (RECURSIVE)
-- Duyệt cây phân cấp chi nhánh từ một node gốc bất kỳ.
-- Trả về toàn bộ subtree (bao gồm chính node gốc) với depth và path.
--
-- Tại sao chọn hàm này để viết recursive:
--   - branches có cột parent_branch_id → cấu trúc cây tự nhiên
--   - Cần duyệt đệ quy để tính tổng doanh thu, nhân sự, phòng của cả subtree
--   - Hàm PL/pgSQL recursive (tự gọi lại) khác với CTE RECURSIVE:
--     CTE RECURSIVE chạy trong 1 query, còn hàm này tự gọi lại theo từng node
--     → phù hợp khi cần xử lý logic phức tạp tại mỗi node (ví dụ: tính KPI)
--
-- Cách dùng:
--   SELECT * FROM fn_get_branch_subtree('55555555-5555-5555-5555-555555555551');
--   → Trả về chi nhánh HN và tất cả chi nhánh con của nó
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_branch_subtree(
  p_branch_id UUID,
  p_depth     INT DEFAULT 0
)
RETURNS TABLE (
  branch_id   UUID,
  parent_id   UUID,
  code        VARCHAR,
  name        VARCHAR,
  city        VARCHAR,
  is_active   BOOLEAN,
  depth       INT,
  path_name   TEXT
) AS $$
DECLARE
  v_branch RECORD;
  v_child  RECORD;
BEGIN
  -- Lấy thông tin node hiện tại
  SELECT b.id, b.parent_branch_id, b.code, b.name, b.city, b.is_active
  INTO v_branch
  FROM branches b
  WHERE b.id = p_branch_id;

  IF NOT FOUND THEN
    RETURN; -- Node không tồn tại → dừng đệ quy
  END IF;

  -- Trả về node hiện tại
  branch_id  := v_branch.id;
  parent_id  := v_branch.parent_branch_id;
  code       := v_branch.code;
  name       := v_branch.name;
  city       := v_branch.city;
  is_active  := v_branch.is_active;
  depth      := p_depth;
  path_name  := REPEAT('  ', p_depth) || v_branch.name;
  RETURN NEXT;

  -- Đệ quy: duyệt tất cả node con
  FOR v_child IN
    SELECT b.id FROM branches b WHERE b.parent_branch_id = p_branch_id
  LOOP
    -- Gọi đệ quy cho từng node con, tăng depth lên 1
    RETURN QUERY SELECT * FROM fn_get_branch_subtree(v_child.id, p_depth + 1);
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: fn_count_branch_subtree_rooms (RECURSIVE)
-- Đếm tổng số phòng của một chi nhánh và toàn bộ chi nhánh con.
-- Ứng dụng: hiển thị tổng phòng theo cây phân cấp trên dashboard owner.
--
-- Cách dùng:
--   SELECT fn_count_branch_subtree_rooms('55555555-5555-5555-5555-555555555551');
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_count_branch_subtree_rooms(p_branch_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_child RECORD;
BEGIN
  -- Đếm phòng trực tiếp của chi nhánh này
  SELECT COUNT(r.id) INTO v_count
  FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id
  WHERE rt.branch_id = p_branch_id;

  -- Đệ quy: cộng thêm phòng của tất cả chi nhánh con
  FOR v_child IN
    SELECT b.id FROM branches b WHERE b.parent_branch_id = p_branch_id
  LOOP
    v_count := v_count + fn_count_branch_subtree_rooms(v_child.id);
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: fn_get_branch_revenue_subtree (RECURSIVE)
-- Tính tổng doanh thu của một chi nhánh và toàn bộ chi nhánh con.
-- Ứng dụng: báo cáo doanh thu theo cây phân cấp chi nhánh.
--
-- Cách dùng:
--   SELECT fn_get_branch_revenue_subtree('55555555-5555-5555-5555-555555555551');
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_branch_revenue_subtree(p_branch_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_revenue NUMERIC := 0;
  v_child   RECORD;
BEGIN
  -- Doanh thu trực tiếp của chi nhánh này
  SELECT COALESCE(SUM(p.amount), 0) INTO v_revenue
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  WHERE b.branch_id = p_branch_id
    AND p.status = 'SUCCESS';

  -- Đệ quy: cộng thêm doanh thu của tất cả chi nhánh con
  FOR v_child IN
    SELECT b.id FROM branches b WHERE b.parent_branch_id = p_branch_id
  LOOP
    v_revenue := v_revenue + fn_get_branch_revenue_subtree(v_child.id);
  END LOOP;

  RETURN v_revenue;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VIEW: v_room_performance_rank_by_hotel
-- Yêu cầu đề bài: "Use SQL Window Functions to rank room performance within
-- each hotel based on revenue"
--
-- Dùng RANK() OVER (PARTITION BY branch_id ORDER BY total_revenue DESC)
-- để xếp hạng từng phòng trong phạm vi chi nhánh (hotel) của nó.
-- Bổ sung thêm:
--   - DENSE_RANK(): xếp hạng liên tục (không bỏ số khi có tie)
--   - ROW_NUMBER(): số thứ tự duy nhất trong mỗi hotel
--   - PERCENT_RANK(): phần trăm vị trí trong hotel (0.0 = top, 1.0 = bottom)
--   - SUM() OVER (PARTITION BY branch_id): tổng doanh thu của cả hotel
--   - revenue_share_pct: % đóng góp của phòng vào tổng doanh thu hotel
-- ============================================================================
CREATE OR REPLACE VIEW v_room_performance_rank_by_hotel AS
WITH room_revenue AS (
    -- Tổng hợp doanh thu thực tế (payments SUCCESS) theo từng phòng
    SELECT
        r.id                                                        AS room_id,
        r.room_number,
        rt.id                                                       AS room_type_id,
        rt.name                                                     AS room_type_name,
        br.id                                                       AS branch_id,
        br.name                                                     AS branch_name,
        br.city                                                     AS branch_city,
        r.rate                                                      AS current_rate,
        r.average_rating,
        COUNT(b.id)                                                 AS total_bookings,
        COALESCE(SUM(
            CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END
        ), 0)                                                       AS total_revenue,
        -- Tổng số đêm đã đặt (để tính occupancy)
        COALESCE(SUM(
            CASE WHEN b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
                 THEN (b.check_out_date - b.check_in_date)
                 ELSE 0
            END
        ), 0)                                                       AS total_nights_booked
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    JOIN branches   br ON br.id = rt.branch_id
    LEFT JOIN bookings  b  ON b.room_id = r.id
                           AND b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
    LEFT JOIN payments  p  ON p.booking_id = b.id
    WHERE rt.is_active = TRUE
      AND br.is_active = TRUE
    GROUP BY r.id, r.room_number, rt.id, rt.name, br.id, br.name, br.city,
             r.rate, r.average_rating
)
SELECT
    rr.room_id,
    rr.room_number,
    rr.room_type_id,
    rr.room_type_name,
    rr.branch_id,
    rr.branch_name,
    rr.branch_city,
    rr.current_rate,
    rr.average_rating,
    rr.total_bookings,
    rr.total_revenue,
    rr.total_nights_booked,

    -- ── Window Functions: xếp hạng trong từng hotel (PARTITION BY branch_id) ──

    -- RANK: xếp hạng theo doanh thu, có thể bỏ số khi tie (1,1,3,4...)
    RANK()        OVER (PARTITION BY rr.branch_id ORDER BY rr.total_revenue DESC)
                                                                    AS revenue_rank,

    -- DENSE_RANK: xếp hạng liên tục, không bỏ số khi tie (1,1,2,3...)
    DENSE_RANK()  OVER (PARTITION BY rr.branch_id ORDER BY rr.total_revenue DESC)
                                                                    AS revenue_dense_rank,

    -- ROW_NUMBER: số thứ tự duy nhất trong hotel (không tie)
    ROW_NUMBER()  OVER (PARTITION BY rr.branch_id ORDER BY rr.total_revenue DESC,
                                                            rr.average_rating DESC,
                                                            rr.room_number ASC)
                                                                    AS row_num_in_hotel,

    -- PERCENT_RANK: vị trí tương đối (0.0 = top performer, 1.0 = bottom)
    ROUND(
        PERCENT_RANK() OVER (PARTITION BY rr.branch_id ORDER BY rr.total_revenue DESC)::NUMERIC,
        4
    )                                                               AS revenue_percent_rank,

    -- Tổng doanh thu của cả hotel (để tính share)
    SUM(rr.total_revenue) OVER (PARTITION BY rr.branch_id)         AS hotel_total_revenue,

    -- % đóng góp doanh thu của phòng vào tổng hotel
    CASE
        WHEN SUM(rr.total_revenue) OVER (PARTITION BY rr.branch_id) = 0 THEN 0
        ELSE ROUND(
            (rr.total_revenue::NUMERIC
             / NULLIF(SUM(rr.total_revenue) OVER (PARTITION BY rr.branch_id), 0) * 100),
            2
        )
    END                                                             AS revenue_share_pct,

    -- Xếp hạng theo rating trong hotel
    RANK() OVER (PARTITION BY rr.branch_id ORDER BY rr.average_rating DESC)
                                                                    AS rating_rank_in_hotel,

    -- Tổng số phòng trong hotel
    COUNT(*) OVER (PARTITION BY rr.branch_id)                      AS total_rooms_in_hotel
FROM room_revenue rr
ORDER BY rr.branch_name, revenue_rank;

-- ============================================================================
-- VIEW: v_room_performance_top3_per_hotel
-- Lấy top 3 phòng doanh thu cao nhất trong mỗi hotel.
-- Dùng RANK() để lọc, đảm bảo tie được giữ lại.
-- ============================================================================
CREATE OR REPLACE VIEW v_room_performance_top3_per_hotel AS
SELECT *
FROM v_room_performance_rank_by_hotel
WHERE revenue_rank <= 3
ORDER BY branch_name, revenue_rank;
