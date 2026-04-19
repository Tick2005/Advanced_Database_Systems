package com.hotel.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.hotel.common.enums.BookingStatus;
import com.hotel.common.enums.RoomStatus;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.payment.PaymentRepository;
import com.hotel.modules.payment.PaymentService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.room.RoomRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
@Tag("Layer1")
class BookingPaymentRoomFlowL1Test {

    private static final UUID CUSTOMER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID BRANCH_ID = UUID.fromString("55555555-5555-5555-5555-555555555551");
    private static final UUID ROOM_ID = UUID.fromString("77777777-7777-7777-7777-777777777772");

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("hotel_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");

        // Feedback module uses MongoDB; this test does not hit it.
        registry.add("spring.data.mongodb.uri", () -> "mongodb://localhost:27017/hotel_test");
    }

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;
    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Test
    void bookingPaymentAndRoomStatusFlowShouldRemainConsistent() {
        BookingCreateRequest bookingRequest = new BookingCreateRequest();
        bookingRequest.setCustomerId(CUSTOMER_ID.toString());
        bookingRequest.setBranchId(BRANCH_ID.toString());
        bookingRequest.setRoomId(ROOM_ID.toString());
        bookingRequest.setCheckInDate(LocalDate.now().plusDays(5));
        bookingRequest.setCheckOutDate(LocalDate.now().plusDays(7));
        bookingRequest.setAdults(2);
        bookingRequest.setChildren(0);
        bookingRequest.setTotalPrice(new BigDecimal("2400000"));

        String bookingId = bookingService.createBooking(bookingRequest).getId();

        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.HOLD);
        assertThat(roomRepository.findById(ROOM_ID).orElseThrow().getStatus())
            .isEqualTo(RoomStatus.HELD);

        PaymentCreateRequest paymentRequest = new PaymentCreateRequest();
        paymentRequest.setBookingId(bookingId);
        paymentRequest.setProvider("vnpay");
        paymentRequest.setAmount(new BigDecimal("2400000"));
        paymentRequest.setCurrency("VND");
        paymentService.createPayment(paymentRequest);

        String transactionRef = paymentRepository.findByBookingId(UUID.fromString(bookingId))
            .orElseThrow()
            .getTransactionRef();

        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.HOLD);
        assertThat(roomRepository.findById(ROOM_ID).orElseThrow().getStatus())
            .isEqualTo(RoomStatus.HELD);

        paymentService.updateByVnPayResult(transactionRef, true, null);

        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.CONFIRMED);
        assertThat(roomRepository.findById(ROOM_ID).orElseThrow().getStatus())
            .isEqualTo(RoomStatus.OCCUPIED);

        bookingService.checkIn(bookingId, BRANCH_ID.toString());
        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.CHECKED_IN);

        bookingService.checkOut(bookingId, BRANCH_ID.toString());
        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.CHECKED_OUT);
        assertThat(roomRepository.findById(ROOM_ID).orElseThrow().getStatus())
            .isEqualTo(RoomStatus.AVAILABLE);
    }
}
