package com.hotel.modules.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.modules.user.UserEntity;
import com.hotel.modules.user.settings.CustomerSettingsRepository;

@Component
public class InactiveAccountCleanupScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(InactiveAccountCleanupScheduler.class);

    private final AuthRepository authRepository;
    private final CustomerSettingsRepository customerSettingsRepository;

    public InactiveAccountCleanupScheduler(
        AuthRepository authRepository,
        CustomerSettingsRepository customerSettingsRepository
    ) {
        this.authRepository = authRepository;
        this.customerSettingsRepository = customerSettingsRepository;
    }

    /**
     * Runs every hour to delete inactive, unverified accounts older than 24 hours.
     * Each account is deleted in its own transaction so one failure does not
     * prevent the rest from being cleaned up.
     */
    @Scheduled(cron = "0 0 * * * *") // top of every hour
    public void cleanupInactiveAccounts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<UserEntity> inactiveUsers = authRepository.findInactiveUsersCreatedBefore(cutoff);

        if (inactiveUsers.isEmpty()) {
            LOGGER.debug("Inactive account cleanup: nothing to do");
            return;
        }

        LOGGER.info("Inactive account cleanup: found {} account(s) created before {}", inactiveUsers.size(), cutoff);

        int deleted = 0;
        for (UserEntity user : inactiveUsers) {
            try {
                deleteOneUser(user.getId(), user.getEmail());
                deleted++;
            } catch (Exception e) {
                LOGGER.error("Failed to delete inactive account {} ({}): {}", user.getId(), user.getEmail(), e.getMessage());
            }
        }

        LOGGER.info("Inactive account cleanup complete: deleted {}/{} account(s)", deleted, inactiveUsers.size());
    }

    /**
     * Deletes a single user and all associated data in its own transaction.
     * Using REQUIRES_NEW so each deletion is independent.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteOneUser(UUID userId, String email) {
        // 1. Customer settings (Postgres)
        customerSettingsRepository.deleteByUserId(userId);
        // 2. PostgreSQL profile
        authRepository.deleteProfileByUserId(userId);
        // 3. PostgreSQL user row
        authRepository.deleteUser(userId);
        LOGGER.info("Deleted inactive account: {} ({})", userId, email);
    }
}
