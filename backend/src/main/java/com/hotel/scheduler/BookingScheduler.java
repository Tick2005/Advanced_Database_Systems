package com.hotel.scheduler;

import com.hotel.modules.booking.BookingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BookingScheduler {

    private final BookingService bookingService;

    public BookingScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelayString = "${app.scheduler.booking-expire-ms:60000}")
    public void expireOverdueHoldBookings() {
        bookingService.expireOverdueHoldBookings();
    }
}
