package com.hotel.integrations.vnpay;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VNPayCallbackAuditRepository extends MongoRepository<VNPayCallbackAuditDocument, String> {

    boolean existsByRequestId(String requestId);

    Optional<VNPayCallbackAuditDocument> findFirstByRequestIdOrderByCreatedAtDesc(String requestId);
}
