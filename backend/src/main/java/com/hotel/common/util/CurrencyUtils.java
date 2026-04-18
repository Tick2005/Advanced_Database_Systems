package com.hotel.common.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public final class CurrencyUtils {

    private static final Locale VIETNAM_LOCALE = Locale.forLanguageTag("vi-VN");

    private CurrencyUtils() {
    }

    public static BigDecimal nonNegative(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    public static String formatVnd(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(VIETNAM_LOCALE);
        return formatter.format(nonNegative(amount));
    }
}