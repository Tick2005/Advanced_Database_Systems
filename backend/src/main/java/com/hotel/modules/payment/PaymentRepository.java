package com.hotel.modules.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {

    Optional<PaymentEntity> findByBookingId(UUID bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentEntity p WHERE p.bookingId = :bookingId")
    Optional<PaymentEntity> findByBookingIdForUpdate(@Param("bookingId") UUID bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentEntity p WHERE p.transactionRef = :transactionRef")
    Optional<PaymentEntity> findByTransactionRefForUpdate(@Param("transactionRef") String transactionRef);

    Optional<PaymentEntity> findFirstByTransactionRefOrderByCreatedAtDesc(String transactionRef);
}
