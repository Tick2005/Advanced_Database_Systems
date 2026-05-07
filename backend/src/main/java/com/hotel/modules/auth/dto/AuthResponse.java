package com.hotel.modules.auth.dto;

public class AuthResponse {

	private String accessToken;
	private String refreshToken;
	private String role;
	private String email;

	public AuthResponse() {
	}

	public AuthResponse(String accessToken, String refreshToken, String role, String email) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.role = role;
		this.email = email;
	}

	public String getAccessToken() {
		return accessToken;
	}

	public void setAccessToken(String accessToken) {
		this.accessToken = accessToken;
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}
}

