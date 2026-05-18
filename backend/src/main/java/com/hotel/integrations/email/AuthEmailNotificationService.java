package com.hotel.integrations.email;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.hotel.modules.user.UserEntity;

@Service
public class AuthEmailNotificationService {

    private final EmailTemplateFactory emailTemplateFactory;
    private final EmailService emailService;

    public AuthEmailNotificationService(EmailTemplateFactory emailTemplateFactory, EmailService emailService) {
        this.emailTemplateFactory = emailTemplateFactory;
        this.emailService = emailService;
    }

    @Async
    public void sendVerificationEmail(UserEntity user, String fullName, String verifyEmailBaseUrl, String token) {
        String verifyUrl = verifyEmailBaseUrl
            + "?email=" + urlEncode(user.getEmail())
            + "&token=" + urlEncode(token);

        String html = emailTemplateFactory.render("mail-verify-account", Map.of(
            "fullName", fullName == null || fullName.isBlank() ? "User" : fullName,
            "verifyUrl", verifyUrl
        ));
        emailService.send(user.getEmail(), "Verify your account", html);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}