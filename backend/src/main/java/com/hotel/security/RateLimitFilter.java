package com.hotel.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 20;
    private static final long TIME_WINDOW_MS = 60000; // 1 minute

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        int count;
        long timestamp;

        RequestCounter(int count, long timestamp) {
            this.count = count;
            this.timestamp = timestamp;
        }
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Only rate limit auth endpoints to prevent brute-force
        if (path.startsWith("/api/v1/auth/")) {
            String ipAddress = getClientIp(request);
            long currentTime = Instant.now().toEpochMilli();

            // Periodically clean up old IPs to prevent memory leaks
            if (Math.random() < 0.01) {
                cleanup(currentTime);
            }

            RequestCounter counter = requestCounts.compute(ipAddress, (key, value) -> {
                if (value == null || currentTime - value.timestamp > TIME_WINDOW_MS) {
                    return new RequestCounter(1, currentTime); // Reset if outside window
                }
                value.count++;
                return value;
            });

            if (counter.count > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(429); // 429 Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write("{\"status\": 429, \"error\": \"Too Many Requests\", \"message\": \"Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
    
    private void cleanup(long currentTime) {
        Iterator<Map.Entry<String, RequestCounter>> iterator = requestCounts.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, RequestCounter> entry = iterator.next();
            if (currentTime - entry.getValue().timestamp > TIME_WINDOW_MS) {
                iterator.remove();
            }
        }
    }
}
