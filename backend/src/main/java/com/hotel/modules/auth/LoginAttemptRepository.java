package com.hotel.modules.auth;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface LoginAttemptRepository extends MongoRepository<LoginAttemptDocument, String> {

    Optional<LoginAttemptDocument> findByEmail(String email);
}
