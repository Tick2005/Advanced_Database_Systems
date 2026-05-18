package com.hotel.modules.pricing.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PricingRepository extends JpaRepository<PricingEntity, UUID> {

    List<PricingEntity> findByActiveTrueOrderByCreatedAtDesc();

    List<PricingEntity> findAllByOrderByCreatedAtDesc();

    /**
     * Tìm tất cả seasons đang active có overlap với khoảng ngày.
     *
     * Quy tắc ưu tiên (ORDER BY) — nhất quán với fn_get_effective_rate trong V6:
     *   1. SPECIFIC_BRANCHES (branch_ids có giá trị) > ALL_BRANCHES (branch_ids rỗng)
     *      → Season của manager (1 branch cụ thể) luôn override season global của owner.
     *   2. Trong cùng scope: tạo sau (created_at DESC) ưu tiên.
     *      → Không dùng |discount| lớn nhất vì không có cơ sở nghiệp vụ:
     *         nếu 1 season giảm 25% (T1) và 1 season tăng 30% (T2 > T1),
     *         lấy |lớn hơn| = lấy cái tăng 30%, sai vì season giảm được tạo sau.
     */
    @Query(value = """
        SELECT ps.*
        FROM pricing_seasons ps
        WHERE ps.is_active = TRUE
          AND ps.starts_on < :checkOut
          AND ps.ends_on  >= :checkIn
          AND (
            array_length(ps.branch_ids, 1) IS NULL
            OR array_length(ps.branch_ids, 1) = 0
            OR :branchId = ANY(ps.branch_ids)
          )
          AND (
            array_length(ps.room_type_ids, 1) IS NULL
            OR array_length(ps.room_type_ids, 1) = 0
            OR :roomTypeId = ANY(ps.room_type_ids)
          )
        ORDER BY
          CASE WHEN array_length(ps.branch_ids, 1) > 0 THEN 0 ELSE 1 END ASC,
          ps.created_at DESC
        """, nativeQuery = true)
    List<PricingEntity> findActiveSeasonForBranchAndDates(
        @Param("branchId")    UUID branchId,
        @Param("roomTypeId")  UUID roomTypeId,
        @Param("checkIn")     LocalDate checkIn,
        @Param("checkOut")    LocalDate checkOut
    );

    /**
     * Kiểm tra có season nào overlap với khoảng ngày cho branch cụ thể không.
     * Dùng để validate khi tạo/approve pricing request.
     */
    @Query(value = """
        SELECT COUNT(*) > 0
        FROM pricing_seasons ps
        WHERE ps.is_active = TRUE
          AND ps.starts_on < :endsOn
          AND ps.ends_on  >= :startsOn
          AND (
            array_length(ps.branch_ids, 1) IS NULL
            OR array_length(ps.branch_ids, 1) = 0
            OR :branchId = ANY(ps.branch_ids)
          )
        """, nativeQuery = true)
    boolean existsActiveOverlapForBranch(
        @Param("branchId")  UUID branchId,
        @Param("startsOn")  LocalDate startsOn,
        @Param("endsOn")    LocalDate endsOn
    );
}
