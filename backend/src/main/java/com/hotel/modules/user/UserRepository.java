package com.hotel.modules.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmail(String email);

    List<UserEntity> findAllByActiveFalseAndEmailVerifiedFalseAndCreatedAtBefore(LocalDateTime createdAt);

    List<UserEntity> findAllByOrderByCreatedAtDesc();
}