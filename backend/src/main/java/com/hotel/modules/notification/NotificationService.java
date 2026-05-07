package com.hotel.modules.notification;

import com.hotel.integrations.email.EmailService;
import com.hotel.integrations.email.EmailTemplateFactory;
import com.hotel.integrations.logging.ActivityLogPublisher;
import com.hotel.modules.notification.dto.EmailNotificationRequest;
import com.hotel.modules.notification.dto.NotificationResponse;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);

    private final EmailTemplateFactory emailTemplateFactory;
    private final EmailService emailService;
    private final ActivityLogPublisher activityLogPublisher;

    public NotificationService(
        EmailTemplateFactory emailTemplateFactory,
        EmailService emailService,
        ActivityLogPublisher activityLogPublisher
    ) {
        this.emailTemplateFactory = emailTemplateFactory;
        this.emailService = emailService;
        this.activityLogPublisher = activityLogPublisher;
    }

    public NotificationResponse sendEmail(EmailNotificationRequest request) {
        String notificationId = "ntf-" + UUID.randomUUID();
        String body = emailTemplateFactory.render(request.getTemplate(), request.getModel());
        boolean sent = emailService.send(request.getTo(), request.getSubject(), body);
        if (!sent) {
            LOGGER.warn("Email notification {} failed for recipient {}", notificationId, request.getTo());
        }

        activityLogPublisher.publish(
            "SEND_EMAIL",
            "NOTIFICATION",
            notificationId,
            Map.of("recipient", request.getTo(), "template", request.getTemplate(), "sent", sent)
        );

        NotificationResponse response = new NotificationResponse();
        response.setNotificationId(notificationId);
        response.setChannel("EMAIL");
        response.setStatus(sent ? "SENT" : "FAILED");
        response.setQueuedAt(Instant.now());
        response.setMessage(sent ? "Email sent" : "Email send failed");
        return response;
    }
}
