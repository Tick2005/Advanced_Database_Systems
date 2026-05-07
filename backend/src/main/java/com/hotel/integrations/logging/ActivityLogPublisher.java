package com.hotel.integrations.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ActivityLogPublisher {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActivityLogPublisher.class);

    public void publish(String action, String targetType, String targetId, Map<String, Object> details) {
        LOGGER.info("activity action={} targetType={} targetId={} details={}", action, targetType, targetId, details);
    }
}
