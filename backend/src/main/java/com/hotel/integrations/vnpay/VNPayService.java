package com.hotel.integrations.vnpay;

import com.hotel.common.enums.PaymentStatus;
import com.hotel.modules.payment.PaymentEntity;
import com.hotel.modules.payment.PaymentService;
import com.hotel.modules.payment.dto.VNPayCallbackResponse;
import com.hotel.modules.payment.dto.VNPayCheckoutRequest;
import com.hotel.modules.payment.dto.VNPayCheckoutResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class VNPayService {

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    // VNPay luôn trả về thời gian theo múi giờ Việt Nam (UTC+7)
    private static final ZoneId VNP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final VNPayClient vnPayClient;
    private final PaymentService paymentService;
    private final VNPayCallbackAuditRepository callbackAuditRepository;

    public VNPayService(
        VNPayClient vnPayClient,
        PaymentService paymentService,
        VNPayCallbackAuditRepository callbackAuditRepository
    ) {
        this.vnPayClient = vnPayClient;
        this.paymentService = paymentService;
        this.callbackAuditRepository = callbackAuditRepository;
    }

    @Transactional
    public VNPayCheckoutResponse createCheckoutUrl(VNPayCheckoutRequest request, String clientIp, String customerId) {
        PaymentEntity payment = paymentService.createVnPayPendingPaymentForCustomer(
            request.getBookingId(),
            customerId,
            request.getAmount(),
            request.getCurrency()
        );

        BigDecimal amount = request.getAmount();
        long amountInMinorUnit = amount.multiply(BigDecimal.valueOf(100)).longValue();
        String orderInfo = request.getOrderInfo() == null || request.getOrderInfo().isBlank()
            ? "Thanh toan dat phong " + request.getBookingId()
            : request.getOrderInfo();

        String checkoutUrl = vnPayClient.buildCheckoutUrl(
            payment.getTransactionRef(),
            amountInMinorUnit,
            orderInfo,
            request.getBankCode(),
            clientIp
        );

        VNPayCheckoutResponse response = new VNPayCheckoutResponse();
        response.setPaymentId(payment.getId().toString());
        response.setBookingId(payment.getBookingId().toString());
        response.setTransactionRef(payment.getTransactionRef());
        response.setCheckoutUrl(checkoutUrl);
        response.setStatus(payment.getStatus().name());
        return response;
    }

    @Transactional
    public VNPayCallbackResponse handleReturnCallback(Map<String, String> queryParams) {
        return handleCallback(queryParams, "RETURN_URL");
    }

    @Transactional
    public VNPayCallbackResponse handleIpnCallback(Map<String, String> queryParams) {
        return handleCallback(queryParams, "IPN");
    }

    @Transactional
    public VNPayCallbackResponse handleCallback(Map<String, String> queryParams, String callbackType) {
        boolean valid = vnPayClient.verifyCallback(queryParams);
        String transactionRef = queryParams.get("vnp_TxnRef");
        String transactionStatus = queryParams.get("vnp_TransactionStatus");
        String responseCode = queryParams.get("vnp_ResponseCode");
        String payDateRaw = queryParams.get("vnp_PayDate");
        String requestId = buildRequestId(callbackType, transactionRef, responseCode, transactionStatus, payDateRaw);

        if (callbackAuditRepository.existsByRequestId(requestId)) {
            VNPayCallbackAuditDocument existing = callbackAuditRepository.findFirstByRequestIdOrderByCreatedAtDesc(requestId)
                .orElse(null);
            VNPayCallbackResponse duplicate = new VNPayCallbackResponse();
            duplicate.setValidSignature(existing == null || existing.isValidSignature());
            duplicate.setTransactionRef(transactionRef);
            duplicate.setTransactionStatus(transactionStatus);
            duplicate.setResponseCode(responseCode);
            duplicate.setPaymentStatus(existing == null ? PaymentStatus.FAILED.name() : existing.getPaymentStatus());
            duplicate.setMessage("Duplicate callback ignored");
            return duplicate;
        }

        PaymentStatus paymentStatus = PaymentStatus.FAILED;
        String message = "Payment failed";

        if (!valid) {
            message = "Invalid VNPay signature";
            // Cố gắng update payment sang FAILED ngay cả khi signature không hợp lệ
            // để tránh payment bị kẹt ở PENDING mãi mãi
            if (transactionRef != null && !transactionRef.isBlank()) {
                try {
                    PaymentEntity updated = paymentService.updateByVnPayResult(transactionRef, false, null);
                    paymentStatus = updated.getStatus();
                } catch (Exception ex) {
                    // Không tìm thấy payment hoặc lỗi khác — giữ FAILED mặc định
                }
            }
        } else {
            boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);
            LocalDateTime paidAt = null;
            if (payDateRaw != null && !payDateRaw.isBlank()) {
                // vnp_PayDate là giờ Việt Nam (UTC+7) — parse với ZoneId rồi convert sang LocalDateTime
                // để lưu nhất quán với JVM timezone (Asia/Ho_Chi_Minh)
                paidAt = LocalDateTime.parse(payDateRaw, VNP_DATE_FORMAT.withZone(VNP_ZONE));
            }
            PaymentEntity updated = paymentService.updateByVnPayResult(transactionRef, success, paidAt);
            paymentStatus = updated.getStatus();
            message = success ? "Payment success" : "Payment failed";
        }

        VNPayCallbackResponse response = new VNPayCallbackResponse();
        response.setValidSignature(valid);
        response.setTransactionRef(transactionRef);
        response.setTransactionStatus(transactionStatus);
        response.setResponseCode(responseCode);
        response.setPaymentStatus(paymentStatus.name());
        response.setMessage(message);
        saveAudit(requestId, callbackType, queryParams, response);
        return response;
    }

    private String buildRequestId(String callbackType, String transactionRef, String responseCode, String transactionStatus, String payDateRaw) {
        return String.join(
            "|",
            callbackType == null ? "UNKNOWN" : callbackType,
            transactionRef == null ? "" : transactionRef,
            responseCode == null ? "" : responseCode,
            transactionStatus == null ? "" : transactionStatus,
            payDateRaw == null ? "" : payDateRaw
        );
    }

    private void saveAudit(String requestId, String callbackType, Map<String, String> queryParams, VNPayCallbackResponse response) {
        VNPayCallbackAuditDocument audit = new VNPayCallbackAuditDocument();
        audit.setRequestId(requestId);
        audit.setCallbackType(callbackType);
        audit.setTransactionRef(response.getTransactionRef());
        audit.setTransactionStatus(response.getTransactionStatus());
        audit.setResponseCode(response.getResponseCode());
        audit.setValidSignature(response.isValidSignature());
        audit.setPaymentStatus(response.getPaymentStatus());
        audit.setMessage(response.getMessage());
        audit.setPayload(new LinkedHashMap<>(queryParams));
        audit.setCreatedAt(Instant.now());
        callbackAuditRepository.save(audit);
    }
}
