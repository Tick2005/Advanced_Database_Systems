package com.hotel.modules.pricing.log;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PricingLogService {

    private final PricingLogRepository pricingLogRepository;

    public PricingLogService(PricingLogRepository pricingLogRepository) {
        this.pricingLogRepository = pricingLogRepository;
    }

    @Transactional(readOnly = true)
    public List<PricingLogEntity> getRecentLogs() {
        return pricingLogRepository.findTop20ByOrderByChangedAtDesc();
    }
}