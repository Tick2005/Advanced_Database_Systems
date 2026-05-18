package com.hotel.modules.dashboard;

import com.hotel.modules.branch.BranchService;
import com.hotel.modules.dashboard.dto.DashboardSummaryResponse;
import com.hotel.modules.report.ReportService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final BranchService branchService;
    private final ReportService reportService;
    private final JdbcTemplate jdbc;

    public DashboardService(BranchService branchService, ReportService reportService, JdbcTemplate jdbc) {
        this.branchService = branchService;
        this.reportService = reportService;
        this.jdbc = jdbc;
    }

    public DashboardSummaryResponse getOwnerSummary() {
        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setActiveBranchCount(branchService.getActiveBranches().size());
        response.setConversion(reportService.getConversionSummary());

        // ── Revenue YTD from v_dashboard_overall_metrics ──────────────────
        try {
            Double revenueYtd = jdbc.queryForObject(
                "SELECT COALESCE(total_revenue, 0) FROM v_dashboard_overall_metrics",
                Double.class);
            double rev = revenueYtd == null ? 0.0 : revenueYtd;
            double cost = Math.round(rev * 0.70);
            double profit = Math.round(rev * 0.30);
            response.setRevenueYtd(rev);
            response.setCostYtd(cost);
            response.setProfitYtd(profit);
            response.setProfitMargin(rev > 0 ? (double) Math.round((profit / rev) * 100.0) : null);
        } catch (Exception ignored) {}

        // ── Booking heatmap for current month ─────────────────────────────
        try {
            String sql = """
                SELECT
                    EXTRACT(DAY FROM created_at)::INT AS day,
                    COUNT(*) AS count
                FROM bookings
                WHERE created_at >= date_trunc('month', CURRENT_DATE)
                  AND created_at <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
                GROUP BY EXTRACT(DAY FROM created_at)
                ORDER BY day
                """;
            List<Map<String, Object>> rows = jdbc.queryForList(sql);
            List<Map<String, Object>> heatmap = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> point = new HashMap<>();
                point.put("day", ((Number) row.get("day")).intValue());
                point.put("count", ((Number) row.get("count")).intValue());
                heatmap.add(point);
            }
            response.setBookingHeatmap(heatmap);
        } catch (Exception ignored) {}

        // ── KPI metrics từ v_kpi_branch_metrics — lấy TẤT CẢ chi nhánh ──
        try {
            String sql = """
                SELECT branch_id, branch_name,
                       COALESCE(total_revenue, 0)    AS total_revenue,
                       COALESCE(net_profit, 0)       AS net_profit,
                       COALESCE(operating_cost, 0)   AS operating_cost,
                       COALESCE(confirmed_bookings,0) AS confirmed_bookings,
                       COALESCE(occupancy_score, 0)  AS occupancy_score,
                       COALESCE(staff_score, 0)      AS staff_score,
                       COALESCE(csr_score, 0)        AS csr_score
                FROM v_kpi_branch_metrics
                ORDER BY total_revenue DESC
                """;
            List<Map<String, Object>> rows = jdbc.queryForList(sql);
            if (!rows.isEmpty()) {
                Map<String, Object> kpi = new HashMap<>();

                // Tổng hợp tất cả chi nhánh thành mảng để frontend vẽ radar đa chiều
                List<Map<String, Object>> allBranches = new ArrayList<>();
                for (Map<String, Object> row : rows) {
                    double rev = ((Number) row.getOrDefault("total_revenue", 0)).doubleValue();
                    Map<String, Object> b = new HashMap<>();
                    b.put("branchId",   row.getOrDefault("branch_id", ""));
                    b.put("branchName", row.getOrDefault("branch_name", ""));
                    b.put("revenue",    Math.round((((Number) row.getOrDefault("net_profit", 0)).doubleValue() / Math.max(rev, 1)) * 100));
                    b.put("occupancy",  ((Number) row.getOrDefault("occupancy_score", 0)).intValue());
                    b.put("csr",        ((Number) row.getOrDefault("csr_score", 0)).intValue());
                    b.put("cost",       Math.round((((Number) row.getOrDefault("operating_cost", 0)).doubleValue() / Math.max(rev, 1)) * 100));
                    b.put("staff",      ((Number) row.getOrDefault("staff_score", 0)).intValue());
                    allBranches.add(b);
                }
                kpi.put("branches", allBranches);
                kpi.put("totalBranches", rows.size());

                // Giữ backward-compat cho frontend cũ (top 2)
                Map<String, Object> a = rows.get(0);
                double revA = ((Number) a.getOrDefault("total_revenue", 0)).doubleValue();
                kpi.put("revenue",   Math.round((((Number) a.getOrDefault("net_profit", 0)).doubleValue() / Math.max(revA, 1)) * 100));
                kpi.put("occupancy", ((Number) a.getOrDefault("occupancy_score", 0)).intValue());
                kpi.put("csr",       ((Number) a.getOrDefault("csr_score", 0)).intValue());
                kpi.put("cost",      Math.round((((Number) a.getOrDefault("operating_cost", 0)).doubleValue() / Math.max(revA, 1)) * 100));
                kpi.put("staff",     ((Number) a.getOrDefault("staff_score", 0)).intValue());
                kpi.put("branchNameA", a.getOrDefault("branch_name", "Chi nhánh 1"));

                if (rows.size() >= 2) {
                    Map<String, Object> b = rows.get(1);
                    double revB = ((Number) b.getOrDefault("total_revenue", 0)).doubleValue();
                    kpi.put("revenuePeer",   Math.round((((Number) b.getOrDefault("net_profit", 0)).doubleValue() / Math.max(revB, 1)) * 100));
                    kpi.put("occupancyPeer", ((Number) b.getOrDefault("occupancy_score", 0)).intValue());
                    kpi.put("csrPeer",       ((Number) b.getOrDefault("csr_score", 0)).intValue());
                    kpi.put("costPeer",      Math.round((((Number) b.getOrDefault("operating_cost", 0)).doubleValue() / Math.max(revB, 1)) * 100));
                    kpi.put("staffPeer",     ((Number) b.getOrDefault("staff_score", 0)).intValue());
                    kpi.put("branchNameB",   b.getOrDefault("branch_name", "Chi nhánh 2"));
                } else {
                    kpi.put("revenuePeer", 0); kpi.put("occupancyPeer", 0);
                    kpi.put("csrPeer", 0); kpi.put("costPeer", 0); kpi.put("staffPeer", 0);
                    kpi.put("branchNameB", "Chi nhánh 2");
                }
                response.setKpiMetrics(kpi);
            }
        } catch (Exception ignored) {}

        // ── Doanh thu 6 tháng theo từng chi nhánh (biểu đồ đường) ─────────
        try {
            String sql = """
                SELECT branch_id, branch_name, period, revenue
                FROM v_branch_revenue_6months
                ORDER BY branch_name, period_date
                """;
            List<Map<String, Object>> rows = jdbc.queryForList(sql);
            // Nhóm theo period → { period, branchName: revenue, ... }
            Map<String, Map<String, Object>> byPeriod = new LinkedHashMap<>();
            for (Map<String, Object> row : rows) {
                String period = (String) row.get("period");
                String branchName = (String) row.get("branch_name");
                double rev = ((Number) row.getOrDefault("revenue", 0)).doubleValue();
                byPeriod.computeIfAbsent(period, k -> {
                    Map<String, Object> p = new LinkedHashMap<>();
                    p.put("period", k);
                    return p;
                }).put(branchName, rev);
            }
            response.setBranchRevenueSeries(new ArrayList<>(byPeriod.values()));
        } catch (Exception ignored) {}

        return response;
    }
}
