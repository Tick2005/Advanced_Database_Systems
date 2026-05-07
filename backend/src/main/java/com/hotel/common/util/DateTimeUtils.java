package com.hotel.common.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DateTimeUtils {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DEFAULT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private DateTimeUtils() {
    }

    public static LocalDateTime nowVietnamTime() {
        return LocalDateTime.now(VIETNAM_ZONE);
    }

    public static boolean isExpired(LocalDateTime expirationTime) {
        return expirationTime != null && expirationTime.isBefore(nowVietnamTime());
    }

    public static String formatDefault(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return DEFAULT_FORMATTER.format(dateTime);
    }

    public static Instant toInstant(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(VIETNAM_ZONE).toInstant();
    }
}