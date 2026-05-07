package com.hotel.integrations.vnpay;

import com.hotel.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class VNPayClient {

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VNP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final String hashSecret;
    private final String payUrl;
    private final String tmnCode;
    private final String returnUrl;

    public VNPayClient(
        @Value("${app.payment.vnpay.hash-secret:vnpay-demo-secret}") String hashSecret,
        @Value("${app.payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
        @Value("${app.payment.vnpay.tmn-code:DEMOV210}") String tmnCode,
        @Value("${app.payment.vnpay.return-url:http://localhost:5173/payment/vnpay-return}") String returnUrl
    ) {
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.tmnCode = tmnCode;
        this.returnUrl = returnUrl;
    }

    public String buildCheckoutUrl(String transactionRef, long amountInMinorUnit, String orderInfo, String bankCode, String clientIp) {
        LocalDateTime now = LocalDateTime.now(VNP_ZONE);
        LocalDateTime expireAt = now.plusMinutes(30);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountInMinorUnit));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", transactionRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
        params.put("vnp_CreateDate", now.format(VNP_DATE_FORMAT));
        params.put("vnp_ExpireDate", expireAt.format(VNP_DATE_FORMAT));

        if (bankCode != null && !bankCode.isBlank()) {
            params.put("vnp_BankCode", bankCode);
        }

        Map<String, String> sorted = params.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (a, b) -> a,
                LinkedHashMap::new
            ));

        String hashData = toQueryString(sorted, true);
        String queryData = toQueryString(sorted, false);
        String secureHash = VNPaySignatureUtil.hmacSha512(hashSecret, hashData);
        return payUrl + "?" + queryData + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyCallback(Map<String, String> queryParams) {
        String expectedSignature = queryParams.get("vnp_SecureHash");
        if (expectedSignature == null || expectedSignature.isBlank()) {
            throw new BusinessException("Missing VNPay signature");
        }

        Map<String, String> sorted = queryParams.entrySet().stream()
            .filter(e -> e.getValue() != null)
            .filter(e -> !"vnp_SecureHash".equals(e.getKey()))
            .filter(e -> !"vnp_SecureHashType".equals(e.getKey()))
            .sorted(Comparator.comparing(Map.Entry::getKey))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (a, b) -> a,
                LinkedHashMap::new
            ));

        String signData = toQueryString(sorted, true);

        String actualSignature = VNPaySignatureUtil.hmacSha512(hashSecret, signData);
        return expectedSignature.equalsIgnoreCase(actualSignature);
    }

    private String toQueryString(Map<String, String> params, boolean encodeForHash) {
        return params.entrySet().stream()
            .map(e -> {
                String key = urlEncode(e.getKey());
                String value = encodeForHash ? urlEncode(e.getValue()) : urlEncode(e.getValue());
                return key + "=" + value;
            })
            .collect(Collectors.joining("&"));
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }
}
