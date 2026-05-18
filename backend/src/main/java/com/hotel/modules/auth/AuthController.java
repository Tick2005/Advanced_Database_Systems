package com.hotel.modules.auth;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.response.ApiResponse;
import com.hotel.modules.auth.dto.AuthActionResponse;
import com.hotel.modules.auth.dto.AuthResponse;
import com.hotel.modules.auth.dto.LoginRequest;
import com.hotel.modules.auth.dto.RefreshTokenRequest;
import com.hotel.modules.auth.dto.RegisterRequest;
import com.hotel.modules.auth.dto.VerifyEmailRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping(ApiPath.AUTH)
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ApiResponse<AuthActionResponse> register(@Valid @RequestBody RegisterRequest request) {
		authService.register(request);
		return ApiResponse.ok("Register successfully. Please check your email to activate your account.", new AuthActionResponse(true));
	}

	@PostMapping("/login")
	public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return ApiResponse.ok("Login successfully", authService.login(request));
	}

	@GetMapping("/verify-email")
	public ApiResponse<AuthActionResponse> verifyEmail(@Valid VerifyEmailRequest request) {
		boolean verified = authService.verifyEmail(request);
		return ApiResponse.ok("Verify email result", new AuthActionResponse(verified));
	}

	@PostMapping("/refresh-token")
	public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
		return ApiResponse.ok("Refresh token successfully", authService.refresh(request));
	}

	@PostMapping("/forgot-password")
	public ApiResponse<AuthActionResponse> forgotPassword(@RequestParam @Email @NotBlank String email) {
		return ApiResponse.ok("Forgot password request received", new AuthActionResponse(authService.forgotPassword(email)));
	}

	@PostMapping("/reset-password")
	public ApiResponse<AuthActionResponse> resetPassword(
		@RequestParam @Email @NotBlank String email,
		@RequestParam @NotBlank String token,
		@RequestParam @NotBlank String newPassword
	) {
		return ApiResponse.ok("Reset password successfully", new AuthActionResponse(authService.resetPassword(email, token, newPassword)));
	}
}

