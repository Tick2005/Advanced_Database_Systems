package com.hotel.modules.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import com.hotel.modules.service.dto.ServiceCreateRequest;
import com.hotel.modules.service.dto.ServiceUpdateRequest;

@SuppressWarnings("null")
@Repository
public class ServiceRepository {

    private final JdbcTemplate jdbcTemplate;

    public ServiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ServiceRecord> findByBranchId(String branchId) {
        String sql = """
            SELECT id, branch_id, code, name, description, thumbnail_url, price, service_mode, is_active
            FROM services
            WHERE branch_id = ?
            ORDER BY created_at DESC
            """;
        return jdbcTemplate.query(sql, rowMapper(), UUID.fromString(branchId));
    }

    public Optional<ServiceRecord> findById(String id) {
        String sql = """
            SELECT id, branch_id, code, name, description, thumbnail_url, price, service_mode, is_active
            FROM services
            WHERE id = ?
            """;
        List<ServiceRecord> rows = jdbcTemplate.query(sql, rowMapper(), UUID.fromString(id));
        return rows.stream().findFirst();
    }

    public Optional<ServiceRecord> findByCode(String code) {
        String sql = """
            SELECT id, branch_id, code, name, description, thumbnail_url, price, service_mode, is_active
            FROM services
            WHERE code = ?
            ORDER BY created_at DESC
            LIMIT 1
            """;
        List<ServiceRecord> rows = jdbcTemplate.query(sql, rowMapper(), code);
        return rows.stream().findFirst();
    }

    public ServiceRecord create(ServiceCreateRequest request) {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update(
            """
            INSERT INTO services (id, branch_id, code, name, description, thumbnail_url, price, service_mode, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS service_mode), TRUE, ?, ?)
            """,
            id,
            UUID.fromString(request.getBranchId()),
            request.getCode(),
            request.getName(),
            request.getDescription(),
            request.getThumbnailUrl(),
            request.getPrice(),
            request.getServiceMode(),
            now,
            now
        );

        return findById(id.toString()).orElseThrow();
    }

    public ServiceRecord update(String id, ServiceUpdateRequest request) {
        ServiceRecord current = findById(id).orElseThrow();
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update(
            """
            UPDATE services
            SET name = ?, description = ?, thumbnail_url = ?, price = ?, service_mode = CAST(? AS service_mode), is_active = ?, updated_at = ?
            WHERE id = ?
            """,
            request.getName() == null ? current.name() : request.getName(),
            request.getDescription() == null ? current.description() : request.getDescription(),
            request.getThumbnailUrl() == null ? current.thumbnailUrl() : request.getThumbnailUrl(),
            request.getPrice() == null ? current.price() : request.getPrice(),
            request.getServiceMode() == null ? current.serviceMode() : request.getServiceMode(),
            request.getActive() == null ? current.active() : Boolean.TRUE.equals(request.getActive()),
            now,
            UUID.fromString(id)
        );

        return findById(id).orElseThrow();
    }

    private @NonNull RowMapper<ServiceRecord> rowMapper() {
        return (rs, rowNum) -> mapRecord(rs);
    }

    private ServiceRecord mapRecord(ResultSet rs) throws SQLException {
        return new ServiceRecord(
            rs.getObject("id", UUID.class),
            rs.getObject("branch_id", UUID.class),
            rs.getString("code"),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("thumbnail_url"),
            rs.getBigDecimal("price"),
            rs.getString("service_mode"),
            rs.getBoolean("is_active")
        );
    }
}