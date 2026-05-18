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
          AND (:roomTypeName IS NULL OR LOWER(rt.name) LIKE LOWER(CONCAT('%', CAST(:roomTypeName AS string), '%')))
          AND r.status = :status
          AND (:minPrice IS NULL OR r.rate >= :minPrice)
          AND (:maxPrice IS NULL OR r.rate <= :maxPrice)
          AND (:branchId IS NULL OR rt.branchId = :branchId)
          AND (:minRating IS NULL OR r.averageRating >= :minRating)
        ORDER BY r.createdAt DESC
        """)
    List<RoomEntity> findBySearchCriteria(
        @Param("roomTypeId") UUID roomTypeId,
        @Param("roomTypeName") String roomTypeName,
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
          AND (:roomTypeName IS NULL OR LOWER(rt.name) LIKE LOWER(CONCAT('%', CAST(:roomTypeName AS string), '%')))
          AND (:minPrice IS NULL OR r.rate >= :minPrice)
          AND (:maxPrice IS NULL OR r.rate <= :maxPrice)
          AND (:branchId IS NULL OR rt.branchId = :branchId)
          AND (:minRating IS NULL OR r.averageRating >= :minRating)
        ORDER BY r.createdAt DESC
        """)
    List<RoomEntity> findBySearchCriteriaWithoutStatus(
        @Param("roomTypeId") UUID roomTypeId,
        @Param("roomTypeName") String roomTypeName,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("branchId") UUID branchId,
        @Param("minRating") Double minRating
    );

    @Query(value = "SELECT "
            + "room_id AS roomId, "
            + "room_number AS roomNumber, "
            + "average_rating AS averageRating, "
            + "score AS score, "
            + "rate AS rate, "
            + "status AS status, "
            + "max_occupancy AS maxOccupancy, "
            + "room_type_id AS roomTypeId, "
            + "room_type_name AS roomTypeName, "
            + "branch_id AS branchId, "
            + "branch_name AS branchName, "
            + "branch_city AS branchCity, "
            + "branch_latitude AS branchLatitude, "
            + "branch_longitude AS branchLongitude, "
            + "distance_km AS distanceKm "
            + "FROM get_top_rooms_by_location(:latitude, :longitude, :limit)", nativeQuery = true)
    List<TopRoomProjection> findTopRoomsByLocation(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("limit") Integer limit
    );

    @Query(value = "SELECT MAX(CASE WHEN regexp_replace(room_number, '\\D','','g') = '' THEN 0 ELSE CAST(regexp_replace(room_number, '\\D','','g') AS INTEGER) END) FROM rooms WHERE room_type_id = :roomTypeId", nativeQuery = true)
    Integer findMaxNumericRoomNumberByRoomType(@Param("roomTypeId") UUID roomTypeId);
}
