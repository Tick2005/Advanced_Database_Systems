package com.hotel.config;

import java.util.Arrays;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        String raw = Objects.requireNonNull(allowedOrigins, "allowedOrigins");
        if ("*".equals(raw)) {
            registry.addMapping("/api/**")
                    .allowedOriginPatterns("*")
                    .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                    .allowedHeaders("*");
        } else {
            String[] origins = Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .toArray(String[]::new);
            registry.addMapping("/api/**")
                    .allowedOrigins(origins)
                    .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                    .allowedHeaders("*");
        }
    }

}