package com.hotel.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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
import com.hotel.exception.BusinessException;
import com.hotel.modules.booking.BookingRepository;
import com.hotel.modules.booking.BookingService;
import com.hotel.modules.booking.dto.BookingCreateRequest;
import com.hotel.modules.payment.PaymentRepository;
import com.hotel.modules.payment.PaymentService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.room.RoomEntity;
import com.hotel.modules.room.RoomRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
@Tag("Layer1")
@SuppressWarnings({"null", "resource", "unused"})
class BookingPaymentRoomFlowL1Test {

    private static final UUID CUSTOMER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID BRANCH_ID = UUID.fromString("55555555-5555-5555-5555-555555555551");
    private static final UUID ROOM_ID = UUID.fromString("77777777-7777-7777-7777-777777777774");
    private static final UUID RETRY_ROOM_ID = UUID.fromString("77777777-7777-7777-7777-777777777775");

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

    @Test
    void vnpayCheckoutRetryShouldReuseTheSamePendingPaymentAndRemainIdempotentOnSuccessCallback() {
        BookingCreateRequest bookingRequest = new BookingCreateRequest();
        bookingRequest.setCustomerId(CUSTOMER_ID.toString());
        bookingRequest.setBranchId(BRANCH_ID.toString());
        bookingRequest.setRoomId(RETRY_ROOM_ID.toString());
        bookingRequest.setCheckInDate(LocalDate.now().plusDays(10));
        bookingRequest.setCheckOutDate(LocalDate.now().plusDays(12));
        bookingRequest.setAdults(2);
        bookingRequest.setChildren(0);
        bookingRequest.setTotalPrice(new BigDecimal("2550000"));

        String bookingId = bookingService.createBooking(bookingRequest).getId();

        PaymentCreateRequest paymentRequest = new PaymentCreateRequest();
        paymentRequest.setBookingId(bookingId);
        paymentRequest.setProvider("vnpay");
        paymentRequest.setAmount(new BigDecimal("2550000"));
        paymentRequest.setCurrency("VND");

        var firstResponse = paymentService.createPayment(paymentRequest);
        var secondResponse = paymentService.createPayment(paymentRequest);

        assertThat(firstResponse.getTransactionRef()).isEqualTo(secondResponse.getTransactionRef());
        assertThat(firstResponse.getId()).isEqualTo(secondResponse.getId());
        assertThat(firstResponse.getStatus()).isEqualTo("PENDING");

        paymentService.updateByVnPayResult(firstResponse.getTransactionRef(), true, null);
        paymentService.updateByVnPayResult(firstResponse.getTransactionRef(), true, null);

        assertThat(paymentRepository.findByBookingId(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(com.hotel.common.enums.PaymentStatus.SUCCESS);
        assertThat(bookingRepository.findById(UUID.fromString(bookingId)).orElseThrow().getStatus())
            .isEqualTo(BookingStatus.CONFIRMED);
    }

    @Test
    void concurrentBookingForSameRoomShouldAllowOnlyOneSuccess() throws Exception {
        RoomEntity templateRoom = roomRepository.findById(ROOM_ID).orElseThrow();
        RoomEntity testRoom = new RoomEntity();
        testRoom.setId(UUID.randomUUID());
        testRoom.setRoomTypeId(templateRoom.getRoomTypeId());
        testRoom.setRoomNumber("CT-" + System.currentTimeMillis());
        testRoom.setStatus(RoomStatus.AVAILABLE);
        testRoom.setRate(templateRoom.getRate());
        testRoom.setMaxOccupancy(templateRoom.getMaxOccupancy());
        testRoom.setCreatedAt(LocalDateTime.now());
        testRoom.setUpdatedAt(LocalDateTime.now());
        roomRepository.save(testRoom);

        LocalDate checkIn = LocalDate.now().plusDays(20);
        LocalDate checkOut = LocalDate.now().plusDays(22);
        CountDownLatch startLatch = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<String> first = executor.submit(() -> createBookingConcurrently(testRoom.getId(), checkIn, checkOut, startLatch));
            Future<String> second = executor.submit(() -> createBookingConcurrently(testRoom.getId(), checkIn, checkOut, startLatch));

            startLatch.countDown();

            String firstResult = first.get();
            String secondResult = second.get();

            int successCount = (firstResult.startsWith("SUCCESS") ? 1 : 0) + (secondResult.startsWith("SUCCESS") ? 1 : 0);
            int failureCount = (firstResult.startsWith("FAILED") ? 1 : 0) + (secondResult.startsWith("FAILED") ? 1 : 0);

            assertThat(successCount).isEqualTo(1);
            assertThat(failureCount).isEqualTo(1);
            assertThat(roomRepository.findById(testRoom.getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.HELD);
        } finally {
            executor.shutdownNow();
        }
    }

    private String createBookingConcurrently(UUID roomId, LocalDate checkIn, LocalDate checkOut, CountDownLatch startLatch) {
        try {
            startLatch.await();
            BookingCreateRequest request = new BookingCreateRequest();
            request.setCustomerId(CUSTOMER_ID.toString());
            request.setBranchId(BRANCH_ID.toString());
            request.setRoomId(roomId.toString());
            request.setCheckInDate(checkIn);
            request.setCheckOutDate(checkOut);
            request.setAdults(2);
            request.setChildren(0);
            request.setTotalPrice(new BigDecimal("3000000"));
            String bookingId = bookingService.createBooking(request).getId();
            return "SUCCESS:" + bookingId;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return "FAILED:Interrupted";
        } catch (BusinessException ex) {
            return "FAILED:" + ex.getMessage();
        } catch (RuntimeException ex) {
            return "FAILED:" + ex.getClass().getSimpleName();
        }
    }
}
