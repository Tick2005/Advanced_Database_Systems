package com.hotel.modules.booking;

import com.hotel.common.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<BookingEntity, UUID>, JpaSpecificationExecutor<BookingEntity> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM BookingEntity b WHERE b.id = :id")
    java.util.Optional<BookingEntity> findByIdForUpdate(@Param("id") UUID id);

    List<BookingEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<BookingEntity> findByStatusAndHoldExpiresAtBefore(BookingStatus status, LocalDateTime dateTime);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM BookingEntity b
        WHERE b.roomId = :roomId
          AND b.status NOT IN :excludedStatuses
          AND b.checkInDate < :checkOutDate
          AND b.checkOutDate > :checkInDate
        """)
    boolean existsActiveOverlap(
        @Param("roomId") UUID roomId,
        @Param("checkInDate") LocalDate checkInDate,
        @Param("checkOutDate") LocalDate checkOutDate,
        @Param("excludedStatuses") List<BookingStatus> excludedStatuses
    );
}
