package com.hotel.modules.room;

import com.hotel.common.enums.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<RoomEntity, UUID> {

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
          AND (:status IS NULL OR r.status = :status)
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
}
