package com.hotel.integration;

import com.hotel.common.enums.Role;
import com.hotel.exception.BusinessException;
import com.hotel.integrations.vnpay.VNPayService;
import com.hotel.modules.auth.AuthService;
import com.hotel.modules.auth.PasswordResetTokenDocument;
import com.hotel.modules.auth.PasswordResetTokenRepository;
import com.hotel.modules.auth.dto.AuthResponse;
import com.hotel.modules.auth.dto.LoginRequest;
import com.hotel.modules.payment.PaymentService;
import com.hotel.modules.payment.dto.PaymentCreateRequest;
import com.hotel.modules.payment.dto.VNPayCallbackResponse;
import com.hotel.modules.user.UserBranchAssignmentEntity;
import com.hotel.modules.user.UserBranchAssignmentRepository;
import com.hotel.modules.user.UserEntity;
import com.hotel.modules.user.UserRepository;
import com.hotel.security.JwtProvider;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@Tag("Layer1")
class AuthAndSecurityFlowL1Test {

    private static final UUID SEEDED_BOOKING_CUSTOMER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID OTHER_CUSTOMER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID BRANCH_ID = UUID.fromString("55555555-5555-5555-5555-555555555551");
    private static final String SEEDED_BOOKING_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("hotel_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");

        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);

        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "2525");
        registry.add("spring.mail.username", () -> "test");
        registry.add("spring.mail.password", () -> "test");
    }

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBranchAssignmentRepository userBranchAssignmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VNPayService vnPayService;

    @Test
    void managerLoginShouldContainBranchIdClaim() {
        UserEntity manager = new UserEntity();
        manager.setId(UUID.randomUUID());
        manager.setEmail("manager-claim@test.local");
        manager.setPasswordHash(passwordEncoder.encode("Passw0rd!"));
        manager.setRole(Role.MANAGER);
        manager.setActive(true);
        manager.setEmailVerified(true);
        manager.setCreatedAt(LocalDateTime.now());
        manager.setUpdatedAt(LocalDateTime.now());
        userRepository.save(manager);

        UserBranchAssignmentEntity assignment = new UserBranchAssignmentEntity();
        assignment.setUserId(manager.getId());
        assignment.setBranchId(BRANCH_ID);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());
        userBranchAssignmentRepository.save(assignment);

        LoginRequest request = new LoginRequest();
        request.setEmail(manager.getEmail());
        request.setPassword("Passw0rd!");

        AuthResponse response = authService.login(request);
        Claims claims = jwtProvider.getClaims(response.getAccessToken());

        assertThat(claims.get("branchId", String.class)).isEqualTo(BRANCH_ID.toString());
        assertThat(claims.get("role", String.class)).isEqualTo(Role.MANAGER.name());
    }

    @Test
    void createPaymentForCustomerShouldRejectWhenBookingOwnerMismatch() {
        PaymentCreateRequest request = new PaymentCreateRequest();
        request.setBookingId(SEEDED_BOOKING_ID);
        request.setProvider("cash");
        request.setAmount(new BigDecimal("100000"));
        request.setCurrency("VND");

        assertThat(SEEDED_BOOKING_CUSTOMER_ID).isNotEqualTo(OTHER_CUSTOMER_ID);
        assertThatThrownBy(() -> paymentService.createPaymentForCustomer(request, OTHER_CUSTOMER_ID.toString()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Booking does not belong to the current customer");
    }

    @Test
    void resetPasswordTokenShouldBeOneTimeUse() {
        String email = "reset-once@test.local";
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("OldPassw0rd!"));
        user.setRole(Role.CUSTOMER);
        user.setActive(true);
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        String rawToken = "reset-token-once-only";
        PasswordResetTokenDocument token = new PasswordResetTokenDocument();
        token.setEmail(email);
        token.setTokenHash(sha256(rawToken));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusSeconds(300));
        passwordResetTokenRepository.save(token);

        boolean firstReset = authService.resetPassword(email, rawToken, "NewPassw0rd!");
        assertThat(firstReset).isTrue();

        assertThatThrownBy(() -> authService.resetPassword(email, rawToken, "AnotherPassw0rd!"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Reset token is invalid or expired");
    }

    @Test
    void publicVnpayIpnEndpointShouldBeAccessibleWithoutJwt() throws Exception {
        VNPayCallbackResponse response = new VNPayCallbackResponse();
        response.setValidSignature(true);
        response.setTransactionRef("VNPAY-TEST-TXN");
        response.setPaymentStatus("SUCCESS");
        response.setResponseCode("00");
        response.setTransactionStatus("00");
        response.setMessage("Payment success");
        when(vnPayService.handleIpnCallback(anyMap())).thenReturn(response);

        mockMvc.perform(post("/api/public/payments/vnpay-ipn")
                .param("vnp_TxnRef", "VNPAY-TEST-TXN")
                .param("vnp_TransactionStatus", "00")
                .param("vnp_ResponseCode", "00"))
            .andExpect(status().isOk());

        verify(vnPayService).handleIpnCallback(anyMap());
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to hash token in test", ex);
        }
    }
}