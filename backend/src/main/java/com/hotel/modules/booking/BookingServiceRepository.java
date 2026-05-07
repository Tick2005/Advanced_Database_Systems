package com.hotel.modules.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookingServiceRepository extends JpaRepository<BookingServiceEntity, UUID> {

    List<BookingServiceEntity> findByBookingId(UUID bookingId);
}
