package com.hotel.scheduler;

import com.hotel.modules.pricing.pricing.PricingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PricingScheduler {

    private final PricingService pricingService;

    public PricingScheduler(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @Scheduled(fixedDelayString = "${app.scheduler.pricing-refresh-ms:3600000}")
    public void refreshSeasonStatus() {
        pricingService.refreshSeasonStatus();
    }
}
