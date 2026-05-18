-- V6: Pricing Management
-- ============================================================================
-- HAI NGUỒN TẠO pricing_season:
--
-- 1. Owner tạo trực tiếp (pricing_seasons):
--    Dịp lễ, sinh nhật khách sạn, sự kiện đặc biệt.
--    branch_ids = {}        → áp dụng TẤT CẢ chi nhánh  (ALL_BRANCHES)
--    branch_ids = {id1,...} → chỉ các chi nhánh được chọn (SPECIFIC_BRANCHES)
--    room_type_ids = {}        → áp dụng TẤT CẢ loại phòng
--    room_type_ids = {id1,...} → chỉ các loại phòng được chọn
--
-- 2. Manager gửi pricing_request → Owner duyệt → tạo pricing_season tự động:
--    Lý do: branch đông/ít khách, chênh lệch mặt bằng giá thị trường.
--    branch_ids = [branch_id của request] → luôn là SPECIFIC_BRANCHES (1 branch).
--    room_type_ids = {} → áp dụng tất cả loại phòng của branch đó.
--
-- Cả 2 nguồn đều dùng chung bảng pricing_seasons và cùng quy tắc ưu tiên.
-- discount_percent > 0 → giảm giá  (giá = base × (1 - discount/100))
-- discount_percent < 0 → tăng giá  (giá = base × (1 - discount/100), vd: -20% → ×1.20)
--
-- QUY TẮC ƯU TIÊN khi nhiều season overlap cùng 1 ngày:
--   1. SPECIFIC_BRANCHES > ALL_BRANCHES
--      Season của manager (1 branch cụ thể) luôn override season global của owner.
--   2. Trong cùng scope: tạo sau (created_at DESC) ưu tiên.
--      Người tạo season mới đã biết có season cũ, vẫn tạo = muốn override.
--      Không dùng |discount| lớn nhất vì không có cơ sở nghiệp vụ —
--      nếu 1 season giảm 25% (T1) và 1 season tăng 30% (T2 > T1),
--      lấy |lớn hơn| = lấy cái tăng 30%, sai vì season giảm được tạo sau.
--
-- Ví dụ minh họa:
--   Season A: ALL_BRANCHES,      11/1→14/1, -25% (tăng giá, tạo T1)
--   Season B: ALL_BRANCHES,      12/1→15/1, +10% (giảm giá, tạo T2 > T1)
--   Season C: SPECIFIC_BRANCHES, 13/1→16/1, -30% (tăng giá, tạo T3 > T2)
--   Booking phòng thuộc branch C, 11/1→16/1 (5 đêm):
--     11/1: chỉ A (ALL)              → base × 1.25
--     12/1: A và B (ALL), B mới hơn  → base × 0.90
--     13/1: A,B (ALL) và C (SPEC)    → C ưu tiên (SPEC > ALL) → base × 1.30
--     14/1: A,B (ALL) và C (SPEC)    → C ưu tiên              → base × 1.30
--     15/1: B (ALL) và C (SPEC)      → C ưu tiên              → base × 1.30
--   Tổng = base × 6.05 → effective_rate = base × 1.21
--
-- GIÁ GỐC (BASE PRICE):
--   room_types.base_price là GIÁ GỐC của loại phòng, do owner quản lý.
--   effective_rate = room_types.base_price × (1 - discount/100)
--   rooms.rate là giá override cụ thể của từng phòng (có thể khác base_price),
--   KHÔNG bị trigger biến đổi khi season active/inactive.
--   Giá hiệu lực được tính on-the-fly bởi fn_get_effective_rate.
--   Điều này tránh lỗi tích lũy khi nhiều season overlap hoặc khi reverse discount.
-- ============================================================================

-- Drop artifacts cũ nếu còn sót từ deployment trước
DROP TRIGGER IF EXISTS trg_auto_calculate_room_price ON bookings;
DROP FUNCTION IF EXISTS fn_auto_calculate_room_price();
DROP TRIGGER IF EXISTS trg_pricing_season_activate ON pricing_seasons;
DROP FUNCTION IF EXISTS fn_apply_pricing_season_to_rooms();

-- ============================================================================
-- HELPER: Kiểm tra season có áp dụng cho branch/room_type không.
-- p_room_type_id = NULL → bỏ qua kiểm tra room_type (dùng khi chỉ biết branch).
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_season_applies_to_room(
  p_season_branch_ids UUID[],
  p_season_rt_ids     UUID[],
  p_room_branch_id    UUID,
  p_room_type_id      UUID
) RETURNS BOOLEAN AS $$
BEGIN
  IF array_length(p_season_branch_ids, 1) > 0 THEN
    IF NOT (p_room_branch_id = ANY(p_season_branch_ids)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  IF p_room_type_id IS NOT NULL AND array_length(p_season_rt_ids, 1) > 0 THEN
    IF NOT (p_room_type_id = ANY(p_season_rt_ids)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER: Tự động sync is_active của pricing_seasons theo ngày.
-- Chạy BEFORE INSERT OR UPDATE OF starts_on, ends_on để đảm bảo is_active
-- luôn đúng ngay khi season được tạo hoặc ngày thay đổi.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_sync_pricing_season_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active  := (CURRENT_DATE >= NEW.starts_on AND CURRENT_DATE <= NEW.ends_on);
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_pricing_season_active ON pricing_seasons;
CREATE TRIGGER trg_sync_pricing_season_active
  BEFORE INSERT OR UPDATE OF starts_on, ends_on ON pricing_seasons
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_pricing_season_active();

-- ============================================================================
-- STORED PROCEDURE: Approve pricing request
--
-- Tạo pricing_season với branch_ids = [branch_id] (SPECIFIC_BRANCHES scope).
-- Season này override season ALL_BRANCHES của owner nhờ quy tắc ưu tiên.
-- KHÔNG tắt season cũ overlap — quy tắc ưu tiên đã xử lý, tắt đi sẽ làm mất
-- season cũ ở phần thời gian không overlap với request mới.
--
-- KHÔNG có COMMIT bên trong — Spring @Transactional sẽ commit sau khi SP return.
-- (COMMIT trong SP gây lỗi "cannot commit during a subtransaction" khi Spring
--  gọi SP trong transaction của nó.)
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_approve_pricing_request(
  p_pricing_request_id  UUID,
  p_reviewed_by_user_id UUID,
  p_review_note         TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_branch_id UUID;
  v_name      VARCHAR(255);
  v_starts_on DATE;
  v_ends_on   DATE;
  v_discount  NUMERIC(5, 2);
  v_is_active BOOLEAN;
BEGIN
  SELECT branch_id, name, starts_on, ends_on, discount_percent
  INTO v_branch_id, v_name, v_starts_on, v_ends_on, v_discount
  FROM pricing_requests
  WHERE id = p_pricing_request_id AND status = 'PENDING';

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Pricing request not found or already processed: %', p_pricing_request_id;
  END IF;

  UPDATE pricing_requests
  SET status      = 'APPROVED',
      reviewed_by = p_reviewed_by_user_id,
      review_note = p_review_note,
      updated_at  = CURRENT_TIMESTAMP
  WHERE id = p_pricing_request_id;

  -- Season active ngay nếu hôm nay nằm trong khoảng thời gian hiệu lực.
  -- Trigger trg_sync_pricing_season_active sẽ tự set is_active đúng khi INSERT.
  v_is_active := (CURRENT_DATE >= v_starts_on AND CURRENT_DATE <= v_ends_on);

  -- discount_percent áp lên room_types.base_price (không phải rooms.rate).
  -- fn_get_effective_rate dùng base_price làm gốc → nhất quán với quy tắc V6.
  INSERT INTO pricing_seasons (
    branch_ids, room_type_ids, name, starts_on, ends_on,
    discount_percent, notes, is_active
  ) VALUES (
    ARRAY[v_branch_id],
    '{}',
    v_name,
    v_starts_on,
    v_ends_on,
    v_discount,
    'Auto-created from pricing_request ' || p_pricing_request_id::TEXT,
    v_is_active
  );
  -- KHÔNG có COMMIT — Spring transaction manager sẽ commit.
END;
$$;

-- ============================================================================
-- STORED PROCEDURE: Reject pricing request — không thay đổi giá.
-- KHÔNG có COMMIT bên trong — Spring @Transactional sẽ commit.
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_reject_pricing_request(
  p_pricing_request_id  UUID,
  p_reviewed_by_user_id UUID,
  p_review_note         TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pricing_requests
  SET status      = 'REJECTED',
      reviewed_by = p_reviewed_by_user_id,
      review_note = p_review_note,
      updated_at  = CURRENT_TIMESTAMP
  WHERE id = p_pricing_request_id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pricing request not found or already processed: %', p_pricing_request_id;
  END IF;
  -- KHÔNG có COMMIT — Spring transaction manager sẽ commit.
END;
$$;

-- ============================================================================
-- FUNCTION: Tính giá hiệu lực của phòng trong khoảng ngày booking.
--
-- GIÁ GỐC: room_types.base_price (không phải rooms.rate).
-- Owner thay đổi base_price → tất cả phòng thuộc loại đó tự động cập nhật.
-- rooms.rate là giá override cụ thể của từng phòng, không bị season biến đổi.
--
-- Trả về:
--   effective_rate     — giá trung bình mỗi đêm sau khi áp season
--   base_rate          — room_types.base_price (giá gốc của loại phòng)
--   total_discount_pct — % discount trung bình hiệu lực (âm = tăng giá)
--   season_name/id/scope — season xuất hiện nhiều đêm nhất (để hiển thị UI)
--   overlap_days       — số đêm có ít nhất 1 season áp dụng
--   total_nights       — tổng số đêm booking
--
-- Ví dụ: Season A (ALL, 11/1→14/1, -25%, T1) + Season B (ALL, 12/1→15/1, +10%, T2>T1)
--   Booking 11/1→15/1 (4 đêm), base_price = 1,000,000:
--     11/1: chỉ A                   → 1,000,000 × 1.25 = 1,250,000
--     12/1: A và B, B mới hơn (T2)  → 1,000,000 × 0.90 =   900,000
--     13/1: A và B, B mới hơn (T2)  → 1,000,000 × 0.90 =   900,000
--     14/1: chỉ B                   → 1,000,000 × 0.90 =   900,000
--   Tổng = 3,950,000 → effective_rate = 987,500
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_effective_rate(
  p_room_id   UUID,
  p_check_in  DATE,
  p_check_out DATE
)
RETURNS TABLE(
  effective_rate     NUMERIC,
  base_rate          NUMERIC,
  total_discount_pct NUMERIC,
  season_name        VARCHAR,
  season_id          UUID,
  season_scope       VARCHAR,
  overlap_days       INT,
  total_nights       INT
) AS $$
DECLARE
  v_branch_id UUID;
  v_rt_id     UUID;
  v_base_rate NUMERIC;   -- room_types.base_price
  v_nights    INT;
BEGIN
  -- Lấy room_types.base_price làm giá gốc (không phải rooms.rate)
  SELECT rt.branch_id, rt.id, rt.base_price
  INTO v_branch_id, v_rt_id, v_base_rate
  FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id
  WHERE r.id = p_room_id;

  IF v_base_rate IS NULL THEN RETURN; END IF;

  v_nights := GREATEST(1, (p_check_out - p_check_in)::INT);

  RETURN QUERY
  WITH
  applicable AS (
    SELECT
      ps.id,
      ps.name,
      ps.discount_percent,
      ps.starts_on,
      ps.ends_on,
      ps.created_at,
      CASE
        WHEN array_length(ps.branch_ids, 1) > 0 THEN 'SPECIFIC_BRANCHES'
        ELSE 'ALL_BRANCHES'
      END AS scope
    FROM pricing_seasons ps
    WHERE ps.is_active = TRUE
      AND ps.starts_on  < p_check_out
      AND ps.ends_on   >= p_check_in
      AND fn_season_applies_to_room(ps.branch_ids, ps.room_type_ids, v_branch_id, v_rt_id)
  ),
  nights AS (
    SELECT generate_series(p_check_in, p_check_out - 1, '1 day'::interval)::DATE AS night
  ),
  night_best_season AS (
    SELECT DISTINCT ON (n.night)
      n.night,
      a.id               AS season_id,
      a.name             AS season_name,
      a.discount_percent,
      a.scope
    FROM nights n
    LEFT JOIN applicable a
      ON n.night >= a.starts_on
     AND n.night <= a.ends_on
    ORDER BY
      n.night,
      a.id NULLS LAST,
      CASE a.scope WHEN 'SPECIFIC_BRANCHES' THEN 0 ELSE 1 END,
      a.created_at DESC
  ),
  summary AS (
    SELECT
      SUM(v_base_rate * (1.0 - COALESCE(nbs.discount_percent, 0) / 100.0)) AS total_price,
      COUNT(*)                                                               AS night_count,
      MODE() WITHIN GROUP (ORDER BY nbs.season_id)                          AS dominant_season_id,
      MODE() WITHIN GROUP (ORDER BY nbs.season_name)                        AS dominant_season_name,
      MODE() WITHIN GROUP (ORDER BY nbs.scope)                              AS dominant_scope,
      COUNT(nbs.season_id)                                                   AS nights_with_season
    FROM night_best_season nbs
  )
  SELECT
    ROUND(s.total_price / s.night_count, 2)                                    AS effective_rate,
    v_base_rate                                                                 AS base_rate,
    ROUND((1.0 - (s.total_price / s.night_count) / v_base_rate) * 100.0, 2)   AS total_discount_pct,
    s.dominant_season_name::VARCHAR                                             AS season_name,
    s.dominant_season_id                                                        AS season_id,
    COALESCE(s.dominant_scope, 'NONE')::VARCHAR                                AS season_scope,
    s.nights_with_season::INT                                                   AS overlap_days,
    v_nights                                                                    AS total_nights
  FROM summary s;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Lấy discount hiệu lực cho 1 ngày cụ thể của 1 phòng.
-- Trả về discount_percent — caller nhân với room_types.base_price (không phải rooms.rate).
-- Áp dụng cùng quy tắc ưu tiên như fn_get_effective_rate.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_apply_seasonal_discount(
  p_room_id       UUID,
  p_branch_id     UUID,
  p_room_type_id  UUID,
  p_date          DATE
)
RETURNS NUMERIC(5, 2) AS $$
DECLARE
  v_discount NUMERIC(5, 2);
BEGIN
  SELECT COALESCE(discount_percent, 0)
  INTO v_discount
  FROM pricing_seasons
  WHERE is_active = TRUE
    AND p_date >= starts_on
    AND p_date <= ends_on
    AND fn_season_applies_to_room(branch_ids, room_type_ids, p_branch_id, p_room_type_id)
  ORDER BY
    CASE WHEN array_length(branch_ids, 1) > 0 THEN 0 ELSE 1 END ASC,
    created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_discount, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Kiểm tra xung đột giá cho booking đang HOLD hoặc PENDING_PAYMENT.
-- Xảy ra khi owner/manager tạo pricing_season mới sau khi booking đã được tạo,
-- làm giá hiệu lực thay đổi so với giá đã chốt lúc booking.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_check_price_conflict(p_booking_id UUID)
RETURNS TABLE(
  has_conflict   BOOLEAN,
  original_rate  NUMERIC,
  effective_rate NUMERIC,
  nights         INT,
  original_total NUMERIC,
  new_total      NUMERIC,
  price_diff     NUMERIC,
  alert_type     VARCHAR,
  alert_message  VARCHAR,
  season_name    VARCHAR,
  season_id      UUID,
  season_scope   VARCHAR,
  overlap_days   INT
) AS $$
DECLARE
  v_booking   RECORD;
  v_eff       RECORD;
  v_new_total NUMERIC;
  v_diff      NUMERIC;
BEGIN
  SELECT b.room_id, b.check_in_date, b.check_out_date,
         b.total_price, b.rate, b.status
  INTO v_booking
  FROM bookings b WHERE b.id = p_booking_id;

  IF NOT FOUND THEN RETURN; END IF;

  IF v_booking.status NOT IN ('HOLD', 'PENDING_PAYMENT') THEN
    RETURN QUERY SELECT
      FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::INT,
      NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC,
      'NONE'::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::UUID,
      'NONE'::VARCHAR, NULL::INT;
    RETURN;
  END IF;

  SELECT * INTO v_eff
  FROM fn_get_effective_rate(v_booking.room_id, v_booking.check_in_date, v_booking.check_out_date);

  IF v_eff IS NULL THEN RETURN; END IF;

  v_new_total := v_eff.effective_rate * v_eff.total_nights;
  v_diff      := v_new_total - COALESCE(v_booking.total_price, 0);

  RETURN QUERY SELECT
    ABS(v_diff) > 0.01,
    v_booking.rate,
    v_eff.effective_rate,
    v_eff.total_nights,
    v_booking.total_price,
    v_new_total,
    v_diff,
    CASE
      WHEN v_diff >  0.01 THEN 'INCREASE'
      WHEN v_diff < -0.01 THEN 'DECREASE'
      ELSE 'NONE'
    END::VARCHAR,
    CASE
      WHEN ABS(v_diff) <= 0.01 THEN NULL
      ELSE format(
        'Giá phòng thay đổi do chương trình "%s" áp dụng trong %s/%s đêm. '
        || 'Giá trung bình mới: %s₫/đêm. Tổng mới: %s₫.',
        COALESCE(v_eff.season_name, 'không tên'),
        v_eff.overlap_days,
        v_eff.total_nights,
        TO_CHAR(v_eff.effective_rate, 'FM999,999,999'),
        TO_CHAR(v_new_total,          'FM999,999,999,999')
      )
    END::VARCHAR,
    v_eff.season_name,
    v_eff.season_id,
    v_eff.season_scope,
    v_eff.overlap_days;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Giá hiệu lực hiện tại của tất cả phòng đang active.
--
-- base_rate      = room_types.base_price (giá gốc của loại phòng, do owner quản lý)
-- room_rate      = rooms.rate (giá override cụ thể của phòng)
-- effective_rate = base_price × (1 - discount/100); bằng base_price nếu không có season
--
-- Dùng để hiển thị danh sách phòng với giá hiện tại và thông tin season.
-- ============================================================================
CREATE OR REPLACE VIEW v_room_effective_rates AS
WITH today_best_season AS (
  SELECT DISTINCT ON (rt.id)
    rt.id        AS room_type_id,
    rt.branch_id,
    ps.id        AS season_id,
    ps.name      AS season_name,
    ps.discount_percent,
    ps.starts_on,
    ps.ends_on,
    CASE
      WHEN array_length(ps.branch_ids, 1) > 0 THEN 'SPECIFIC_BRANCHES'
      ELSE 'ALL_BRANCHES'
    END AS season_scope
  FROM room_types rt
  LEFT JOIN pricing_seasons ps ON (
    ps.is_active = TRUE
    AND ps.starts_on <= CURRENT_DATE
    AND ps.ends_on   >= CURRENT_DATE
    AND fn_season_applies_to_room(ps.branch_ids, ps.room_type_ids, rt.branch_id, rt.id)
  )
  ORDER BY
    rt.id,
    CASE WHEN array_length(ps.branch_ids, 1) > 0 THEN 0 ELSE 1 END ASC,
    ps.created_at DESC NULLS LAST
)
SELECT
  r.id                                                                      AS room_id,
  r.room_number,
  rt.base_price                                                             AS base_rate,
  r.rate                                                                    AS room_rate,
  CASE
    WHEN tbs.season_id IS NOT NULL
    THEN ROUND(rt.base_price * (1.0 - tbs.discount_percent / 100.0), 2)
    ELSE rt.base_price
  END                                                                       AS effective_rate,
  rt.branch_id,
  b.name                                                                    AS branch_name,
  tbs.season_id                                                             AS active_season_id,
  tbs.season_name                                                           AS active_season_name,
  tbs.discount_percent                                                      AS active_discount_percent,
  tbs.season_scope                                                          AS active_season_scope,
  tbs.starts_on                                                             AS season_starts_on,
  tbs.ends_on                                                               AS season_ends_on
FROM rooms r
JOIN room_types rt ON rt.id  = r.room_type_id
JOIN branches   b  ON b.id   = rt.branch_id
LEFT JOIN today_best_season tbs ON tbs.room_type_id = rt.id
WHERE rt.is_active = TRUE
  AND b.is_active  = TRUE;
