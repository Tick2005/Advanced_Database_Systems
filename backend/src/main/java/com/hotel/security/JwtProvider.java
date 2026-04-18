package com.hotel.security;

import com.hotel.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtProvider {

    private final JwtConfig jwtConfig;

    public JwtProvider(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public String generateAccessToken(String userId, String email, String role) {
        return generateAccessToken(userId, email, role, null);
    }

    public String generateAccessToken(String userId, String email, String role, String branchId) {
        Instant now = Instant.now();
        Instant exp = now.plus(jwtConfig.getAccessTokenExpirationMinutes(), ChronoUnit.MINUTES);

        var builder = Jwts.builder()
            .subject(email)
            .claim("uid", userId)
            .claim("role", role)
            .claim("typ", "access")
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(getSigningKey());

        if (branchId != null && !branchId.isBlank()) {
            builder.claim("branchId", branchId);
        }

        return builder.compact();
    }

    public String generateRefreshToken(String userId, String email, String role) {
        return generateRefreshToken(userId, email, role, null);
    }

    public String generateRefreshToken(String userId, String email, String role, String branchId) {
        Instant now = Instant.now();
        Instant exp = now.plus(jwtConfig.getRefreshTokenExpirationDays(), ChronoUnit.DAYS);

        var builder = Jwts.builder()
            .subject(email)
            .claim("uid", userId)
            .claim("role", role)
            .claim("typ", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(getSigningKey());

        if (branchId != null && !branchId.isBlank()) {
            builder.claim("branchId", branchId);
        }

        return builder.compact();
    }

    public String generateEmailVerificationToken(String userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plus(30, ChronoUnit.MINUTES);

        return Jwts.builder()
            .subject(email)
            .claim("uid", userId)
            .claim("typ", "verify-email")
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean isEmailVerificationTokenValid(String token, String expectedEmail) {
        if (!isValid(token)) {
            return false;
        }

        Claims claims = getClaims(token);
        String type = String.valueOf(claims.getOrDefault("typ", ""));
        if (!"verify-email".equals(type)) {
            return false;
        }

        String subject = claims.getSubject();
        return subject != null && subject.equalsIgnoreCase(expectedEmail);
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtConfig.getSecret());
        } catch (IllegalArgumentException ex) {
            keyBytes = jwtConfig.getSecret().getBytes();
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}