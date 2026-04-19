package com.hotel.modules.room;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hotel.common.enums.RoomStatus;

import jakarta.persistence.LockModeType;

public interface RoomRepository extends JpaRepository<RoomEntity, UUID> {

        @Query(value = """
                SELECT picked.room_id AS roomId, picked.image_url AS imageUrl
                FROM (
                    SELECT
                        ri.room_id,
                        ri.image_url,
                        ROW_NUMBER() OVER (PARTITION BY ri.room_id ORDER BY ri.is_cover DESC, ri.sort_order ASC, ri.created_at ASC) AS rn
                    FROM room_images ri
                    WHERE ri.room_id IN (:roomIds)
                ) picked
                WHERE picked.rn = 1
                """, nativeQuery = true)
        List<RoomCoverImageProjection> findCoverImageUrls(@Param("roomIds") List<UUID> roomIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomEntity r WHERE r.id = :id")
    java.util.Optional<RoomEntity> findByIdForUpdate(@Param("id") UUID id);

    List<RoomEntity> findByStatus(RoomStatus status);

    List<RoomEntity> findByRoomTypeId(UUID roomTypeId);

    @Query("""
        SELECT r
        FROM RoomEntity r
        JOIN RoomTypeEntity rt ON rt.id = r.roomTypeId
        WHERE (:roomTypeId IS NULL OR r.roomTypeId = :roomTypeId)
                    AND r.status = :status
          AND (:minPrice IS NULL OR r.rate >= :minPrice)
          AND (:maxPrice IS NULL OR r.rate <= :maxPrice)
          AND (:branchId IS NULL OR rt.branchId = :branchId)
          AND (:minRating IS NULL OR rt.averageRating >= :minRating)
        ORDER BY r.createdAt DESC
        """)
    List<RoomEntity> findBySearchCriteria(
        @Param("roomTypeId") UUID roomTypeId,
        @Param("status") RoomStatus status,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("branchId") UUID branchId,
        @Param("minRating") Double minRating
    );

    @Query("""
        SELECT r
        FROM RoomEntity r
        JOIN RoomTypeEntity rt ON rt.id = r.roomTypeId
        WHERE (:roomTypeId IS NULL OR r.roomTypeId = :roomTypeId)
          AND (:minPrice IS NULL OR r.rate >= :minPrice)
          AND (:maxPrice IS NULL OR r.rate <= :maxPrice)
          AND (:branchId IS NULL OR rt.branchId = :branchId)
          AND (:minRating IS NULL OR rt.averageRating >= :minRating)
        ORDER BY r.createdAt DESC
        """)
    List<RoomEntity> findBySearchCriteriaWithoutStatus(
        @Param("roomTypeId") UUID roomTypeId,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("branchId") UUID branchId,
        @Param("minRating") Double minRating
    );
}
