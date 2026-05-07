package com.hotel.modules.report;

import com.hotel.modules.report.dto.BookingReportResponse;
import com.hotel.modules.report.dto.ConversionSummaryResponse;
import com.hotel.modules.report.dto.RevenueReportResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public ReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RevenueReportResponse> getTopRoomTypesByProfit() {
        String sql = """
            SELECT room_type_id, room_type_name, branch_id, branch_name, revenue_quarter, total_revenue, profit_rank
            FROM v_top_room_types_by_profit
            ORDER BY revenue_quarter DESC, profit_rank ASC
            LIMIT 20
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            RevenueReportResponse response = new RevenueReportResponse();
            response.setRoomTypeId(rs.getString("room_type_id"));
            response.setRoomTypeName(rs.getString("room_type_name"));
            response.setBranchId(rs.getString("branch_id"));
            response.setBranchName(rs.getString("branch_name"));
            response.setRevenueQuarter(String.valueOf(rs.getDate("revenue_quarter")));
            response.setTotalRevenue(rs.getDouble("total_revenue"));
            response.setProfitRank(rs.getInt("profit_rank"));
            return response;
        });
    }

    public List<BookingReportResponse> getRoomRevenueByQuarter() {
        String sql = """
            SELECT room_id, branch_id, revenue_quarter, total_revenue, booking_count
            FROM v_room_revenue_by_quarter
            ORDER BY revenue_quarter DESC, total_revenue DESC
            LIMIT 50
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            BookingReportResponse response = new BookingReportResponse();
            response.setRoomId(rs.getString("room_id"));
            response.setBranchId(rs.getString("branch_id"));
            response.setRevenueQuarter(String.valueOf(rs.getDate("revenue_quarter")));
            response.setTotalRevenue(rs.getDouble("total_revenue"));
            response.setBookingCount(rs.getInt("booking_count"));
            return response;
        });
    }

    public ConversionSummaryResponse getConversionSummary() {
        Integer confirmed = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED'",
            Integer.class
        );
        Integer total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bookings",
            Integer.class
        );

        int confirmedValue = confirmed == null ? 0 : confirmed;
        int totalValue = total == null ? 0 : total;
        double rate = totalValue == 0 ? 0 : (double) confirmedValue / totalValue;

        ConversionSummaryResponse response = new ConversionSummaryResponse();
        response.setConfirmed(confirmedValue);
        response.setTotal(totalValue);
        response.setConversionRate(rate);
        return response;
    }
}