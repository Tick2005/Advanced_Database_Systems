package com.hotel.modules.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.common.constants.AppConstants;
import com.hotel.common.enums.Role;
import com.hotel.exception.BusinessException;
import com.hotel.integrations.email.EmailService;
import com.hotel.integrations.email.EmailTemplateFactory;
import com.hotel.modules.auth.dto.AuthResponse;
import com.hotel.modules.auth.dto.LoginRequest;
import com.hotel.modules.auth.dto.RefreshTokenRequest;
import com.hotel.modules.auth.dto.RegisterRequest;
import com.hotel.modules.auth.dto.VerifyEmailRequest;
import com.hotel.modules.user.ProfileEntity;
import com.hotel.modules.user.UserEntity;
import com.hotel.security.JwtProvider;

@Service
public class AuthService {

	private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);

	private final AuthRepository authRepository;
	private final AuthMapper authMapper;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;
	private final EmailTemplateFactory emailTemplateFactory;
	private final EmailService emailService;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final LoginAttemptRepository loginAttemptRepository;
	private final String verifyEmailBaseUrl;
	private final String resetPasswordBaseUrl;
	private final int resetPasswordExpireMinutes;

	public AuthService(
		AuthRepository authRepository,
		AuthMapper authMapper,
		PasswordEncoder passwordEncoder,
		JwtProvider jwtProvider,
		EmailTemplateFactory emailTemplateFactory,
		EmailService emailService,
		PasswordResetTokenRepository passwordResetTokenRepository,
		LoginAttemptRepository loginAttemptRepository,
		@Value("${app.auth.verify-email-base-url:http://localhost:5173/verify-email}") String verifyEmailBaseUrl,
		@Value("${app.auth.reset-password-base-url:http://localhost:5173/reset-password}") String resetPasswordBaseUrl,
		@Value("${app.auth.reset-password-expire-minutes:15}") int resetPasswordExpireMinutes
	) {
		this.authRepository = authRepository;
		this.authMapper = authMapper;
		this.passwordEncoder = passwordEncoder;
		this.jwtProvider = jwtProvider;
		this.emailTemplateFactory = emailTemplateFactory;
		this.emailService = emailService;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.loginAttemptRepository = loginAttemptRepository;
		this.verifyEmailBaseUrl = verifyEmailBaseUrl;
		this.resetPasswordBaseUrl = resetPasswordBaseUrl;
		this.resetPasswordExpireMinutes = resetPasswordExpireMinutes;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.getEmail());
		if (authRepository.findUserByEmail(email).isPresent()) {
			throw new BusinessException("Email already exists");
		}

		LocalDateTime now = LocalDateTime.now();
		UserEntity user = new UserEntity();
		user.setId(UUID.randomUUID());
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		user.setRole(Role.CUSTOMER);
		user.setActive(false);
		user.setEmailVerified(false);
		user.setCreatedAt(now);
		user.setUpdatedAt(now);
		UserEntity savedUser = authRepository.saveUser(user);

		ProfileEntity profile = new ProfileEntity();
		profile.setUserId(savedUser.getId());
		profile.setFullName(request.getFullName());
		profile.setPreferredLanguage(AppConstants.DEFAULT_LANGUAGE);
		profile.setCreatedAt(now);
		profile.setUpdatedAt(now);
		authRepository.saveProfile(profile);

		// Send email asynchronously - don't block registration response
		sendVerificationEmail(savedUser, request.getFullName());

		return authMapper.toAuthResponse(savedUser, resolveBranchIdForToken(savedUser));
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.getEmail());
		LoginAttemptDocument loginAttempt = loginAttemptRepository.findByEmail(email).orElseGet(() -> {
			LoginAttemptDocument document = new LoginAttemptDocument();
			document.setEmail(email);
			document.setFailedCount(0);
			document.setUpdatedAt(Instant.now());
			return loginAttemptRepository.save(document);
		});

		if (loginAttempt.getLockedUntil() != null && loginAttempt.getLockedUntil().isAfter(Instant.now())) {
			throw new BusinessException("Account temporarily locked. Please try again later.");
		}

		UserEntity user = authRepository.findUserByEmail(email)
			.orElseThrow(() -> new BusinessException("Invalid credentials"));

		if (!user.isActive()) {
			throw new BusinessException("Account is inactive");
		}

		if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
			handleFailedLogin(loginAttempt);
			throw new BusinessException("Invalid credentials");
		}

		if (loginAttempt.getFailedCount() > 0 || loginAttempt.getLockedUntil() != null) {
			loginAttempt.setFailedCount(0);
			loginAttempt.setLockedUntil(null);
			loginAttempt.setUpdatedAt(Instant.now());
			loginAttemptRepository.save(loginAttempt);
		}

		return authMapper.toAuthResponse(user, resolveBranchIdForToken(user));
	}

	private void handleFailedLogin(LoginAttemptDocument loginAttempt) {
		int failedCount = loginAttempt.getFailedCount() + 1;
		loginAttempt.setFailedCount(failedCount);
		loginAttempt.setLastFailedAt(Instant.now());
		loginAttempt.setUpdatedAt(Instant.now());

		if (failedCount >= 3) {
			loginAttempt.setLockedUntil(Instant.now().plus(1, ChronoUnit.DAYS));
			loginAttempt.setFailedCount(0);
		}

		loginAttemptRepository.save(loginAttempt);
	}

	@Transactional(readOnly = true)
	public AuthResponse refresh(RefreshTokenRequest request) {
		if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
			throw new BusinessException("Refresh token is required");
		}

		String refreshToken = request.getRefreshToken();
		if (!jwtProvider.isValid(refreshToken)) {
			throw new BusinessException("Invalid refresh token");
		}

		var claims = jwtProvider.getClaims(refreshToken);
		String type = String.valueOf(claims.getOrDefault("typ", ""));
		if (!"refresh".equals(type)) {
			throw new BusinessException("Invalid token type");
		}

		String email = normalizeEmail(claims.getSubject());
		UserEntity user = authRepository.findUserByEmail(email)
			.orElseThrow(() -> new BusinessException("Account not found"));

		if (!user.isActive()) {
			throw new BusinessException("Account is inactive");
		}

		return authMapper.toAuthResponse(user, resolveBranchIdForToken(user));
	}

	@Transactional
	public boolean verifyEmail(VerifyEmailRequest request) {
		if (request.getToken() == null || request.getToken().isBlank()) {
			return false;
		}

		String email = normalizeEmail(request.getEmail());
		if (!jwtProvider.isEmailVerificationTokenValid(request.getToken(), email)) {
			return false;
		}

		UserEntity user = authRepository.findUserByEmail(email).orElse(null);
		if (user == null) {
			return false;
		}

		if (user.isEmailVerified()) {
			return false;
		}

		user.setEmailVerified(true);
		// Activate account after successful email verification
		user.setActive(true);
		user.setUpdatedAt(LocalDateTime.now());
		authRepository.saveUser(user);

		return true;
	}

	@Transactional(readOnly = true)
	public boolean forgotPassword(String email) {
		String normalized = normalizeEmail(email);
		UserEntity user = authRepository.findUserByEmail(normalized).orElse(null);
		if (user != null) {
			String rawToken = "reset-" + UUID.randomUUID() + "-" + UUID.randomUUID().toString().substring(0, 8);
			String tokenHash = sha256(rawToken);

			PasswordResetTokenDocument tokenDocument = new PasswordResetTokenDocument();
			tokenDocument.setEmail(normalized);
			tokenDocument.setTokenHash(tokenHash);
			tokenDocument.setCreatedAt(Instant.now());
			tokenDocument.setExpiresAt(Instant.now().plusSeconds((long) resetPasswordExpireMinutes * 60L));
			passwordResetTokenRepository.save(tokenDocument);

			String fullName = authRepository.findProfileByUserId(user.getId()).map(ProfileEntity::getFullName).orElse("User");
			String resetUrl = resetPasswordBaseUrl
				+ "?email=" + urlEncode(normalized)
				+ "&token=" + urlEncode(rawToken);
			String html = emailTemplateFactory.render("mail-reset-password", Map.of(
				"fullName", fullName == null || fullName.isBlank() ? "User" : fullName,
				"resetUrl", resetUrl,
				"expiresInMinutes", String.valueOf(resetPasswordExpireMinutes)
			));
			emailService.send(normalized, "Reset your password", html);
		}
		return true;
	}

	@Transactional
	public boolean resetPassword(String email, String token, String newPassword) {
		String normalized = normalizeEmail(email);
		String tokenHash = sha256(token);

		PasswordResetTokenDocument resetToken = passwordResetTokenRepository
			.findFirstByEmailAndTokenHashAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
				normalized,
				tokenHash,
				Instant.now()
			)
			.orElseThrow(() -> new BusinessException("Reset token is invalid or expired"));

		UserEntity user = authRepository.findUserByEmail(normalized)
			.orElseThrow(() -> new BusinessException("Account not found"));
		user.setPasswordHash(passwordEncoder.encode(newPassword));
		user.setUpdatedAt(LocalDateTime.now());
		authRepository.saveUser(user);

		resetToken.setUsedAt(Instant.now());
		passwordResetTokenRepository.save(resetToken);
		return true;
	}

	private String normalizeEmail(String email) {
		if (email == null || email.isBlank()) {
			throw new BusinessException("Email is required");
		}
		return email.trim().toLowerCase();
	}

	@Async
	private void sendVerificationEmail(UserEntity user, String fullName) {
		String token = jwtProvider.generateEmailVerificationToken(user.getId().toString(), user.getEmail());
		String verifyUrl = verifyEmailBaseUrl
			+ "?email=" + urlEncode(user.getEmail())
			+ "&token=" + urlEncode(token);

		String html = emailTemplateFactory.render("mail-verify-account", Map.of(
			"fullName", fullName == null || fullName.isBlank() ? "User" : fullName,
			"verifyUrl", verifyUrl
		));
		if (!emailService.send(user.getEmail(), "Verify your account", html)) {
			LOGGER.warn("Verification email could not be delivered to {}", user.getEmail());
		}
	}

	private String urlEncode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException ex) {
			throw new BusinessException("Unable to hash token");
		}
	}

	private String resolveBranchIdForToken(UserEntity user) {
		if (user.getRole() != Role.MANAGER && user.getRole() != Role.STAFF) {
			return null;
		}

		return authRepository.findBranchIdByUserId(user.getId())
			.map(UUID::toString)
			.orElseThrow(() -> new BusinessException("Branch assignment is required for role: " + user.getRole().name()));
	}
}

