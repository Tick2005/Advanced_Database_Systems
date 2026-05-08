package com.hotel.controllers.internal;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.modules.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SeedController – chỉ khả dụng ở profile "dev" hoặc "test".
 * Cung cấp endpoint để (re-)seed database mẫu phục vụ kiểm thử / demo.
 *
 * POST /api/internal/seed
 *   → Trả về thống kê số bản ghi đã tồn tại / được đảm bảo.
 *
 * Commit: feat(seed): thêm SeedController – khởi tạo dữ liệu mẫu qua API, chỉ bật ở dev/test
 */
@Profile({"dev", "test"})
@RestController
@RequestMapping(ApiPath.INTERNAL + "/seed")
public class SeedController {

	private static final Logger log = LoggerFactory.getLogger(SeedController.class);

	private final JdbcTemplate jdbc;
	private final UserService  userService;

	public SeedController(JdbcTemplate jdbc, UserService userService) {
		this.jdbc        = jdbc;
		this.userService = userService;
	}

	/**
	 * Kiểm tra trạng thái seed hiện tại.
	 * Đếm số bản ghi chính trong DB và trả về summary.
	 */
	@PostMapping("/check")
	public ApiResponse<Map<String, Object>> checkSeed() {
		Map<String, Object> counts = new LinkedHashMap<>();
		try {
			counts.put("users",    count("users"));
			counts.put("branches", count("branches"));
			counts.put("rooms",    count("rooms"));
			counts.put("services", count("services"));
			counts.put("bookings", count("bookings"));
			counts.put("payments", count("payments"));
			counts.put("feedbacks", countSafe("feedbacks"));
			counts.put("pricingRequests", countSafe("pricing_requests"));
			counts.put("status", "ok");
			log.info("[Seed] Check seed – counts: {}", counts);
		} catch (Exception ex) {
			counts.put("status", "error");
			counts.put("error", ex.getMessage());
			log.warn("[Seed] Check failed: {}", ex.getMessage());
		}
		return ApiResponse.ok("Seed check completed", counts);
	}

	/**
	 * Reset soft: Xoá dữ liệu booking / payment / feedback rồi chạy lại seed SQL.
	 * Không xoá users / branches / rooms để tránh vi phạm FK phức tạp.
	 * Migration Flyway V7 đã dùng ON CONFLICT DO NOTHING nên an toàn khi gọi lại.
	 */
	@PostMapping("/reset-demo")
	public ApiResponse<Map<String, Object>> resetDemo() {
		Map<String, Object> result = new LinkedHashMap<>();
		try {
			log.info("[Seed] Starting demo reset...");

			// Xoá theo thứ tự FK
			jdbc.execute("DELETE FROM booking_services WHERE booking_id LIKE 'aaaaaaaa%'");
			jdbc.execute("DELETE FROM payments       WHERE booking_id LIKE 'aaaaaaaa%'");
			jdbc.execute("DELETE FROM bookings       WHERE id          LIKE 'aaaaaaaa%'");
			safeDelete("feedbacks",        "id LIKE 'ff%'");
			safeDelete("room_rate_change_audit", "id IN (1, 2)");
			safeDelete("pricing_requests", "id LIKE 'dd%'");

			result.put("deleted", true);
			result.put("message", "Demo data cleared. Flyway V7 seed sẽ được áp dụng lại khi restart app hoặc chạy migration.");
			result.put("hint",    "Gọi POST /api/internal/seed/check sau khi restart để xác nhận.");
			result.put("status",  "ok");

			log.info("[Seed] Demo reset completed.");
		} catch (Exception ex) {
			result.put("status", "error");
			result.put("error",  ex.getMessage());
			log.error("[Seed] Reset failed: {}", ex.getMessage(), ex);
		}
		return ApiResponse.ok("Demo reset completed", result);
	}

	// ── helpers ──────────────────────────────────────────────

	private int count(String table) {
		Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
		return n != null ? n : 0;
	}

	private int countSafe(String table) {
		try { return count(table); } catch (Exception ex) { return -1; }
	}

	private void safeDelete(String table, String where) {
		try { jdbc.execute("DELETE FROM " + table + " WHERE " + where); }
		catch (Exception ex) { log.warn("[Seed] safeDelete {} skipped: {}", table, ex.getMessage()); }
	}
}
