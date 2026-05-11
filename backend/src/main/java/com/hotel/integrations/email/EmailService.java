package com.hotel.integrations.email;

import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
        JavaMailSender mailSender,
        @Value("${app.mail.from:${spring.mail.username:no-reply@luxstay.phanvanduong.site}}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public boolean send(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(Objects.requireNonNull(fromAddress, "fromAddress"));
            helper.setTo(Objects.requireNonNull(to, "to"));
            helper.setSubject(Objects.requireNonNull(subject, "subject"));
            helper.setText(Objects.requireNonNull(body, "body"), true);
            mailSender.send(message);
            LOGGER.info("Email sent to {} with subject {}", to, subject);
            return true;
        } catch (MessagingException | RuntimeException ex) {
            LOGGER.error("Send email failed for recipient {} with subject {}", to, subject, ex);
            return false;
        }
    }
}
