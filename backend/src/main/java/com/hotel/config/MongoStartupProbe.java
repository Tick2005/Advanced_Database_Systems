package com.hotel.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.mongodb.BasicDBObject;

/**
 * Startup probe for MongoDB that validates connectivity and checks seeding status.
 * The seed data is initialized via init-hotel.js script executed during Docker initialization.
 */
@Component
public class MongoStartupProbe {

    private final MongoTemplate mongoTemplate;

    public MongoStartupProbe(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void mongoHealthCheck() {
        try {
            // Test connectivity with a ping command
            BasicDBObject pingCmd = new BasicDBObject("ping", 1);
            mongoTemplate.getDb().runCommand(pingCmd);
            
            String database = mongoTemplate.getDb().getName();
            System.out.println("✓ MongoDB connection successful: database=" + database);

            // Check collections and document counts
            long feedbackCount = mongoTemplate.getCollection("feedbacks").countDocuments();
            long sessionCount = mongoTemplate.getCollection("sessions").countDocuments();
            long catalogCount = mongoTemplate.getCollection("hotel_catalogs").countDocuments();
            
            System.out.println("  - feedbacks collection: " + feedbackCount + " documents");
            System.out.println("  - sessions collection: " + sessionCount + " documents");
            System.out.println("  - hotel_catalogs collection: " + catalogCount + " documents");

            // Notify if collections are empty
            if (feedbackCount == 0 || sessionCount == 0 || catalogCount == 0) {
                System.out.println("ℹ️  Collections are empty. Seed data should be loaded via init-hotel.js");
            } else {
                System.out.println("✓ Database is seeded with demo data");
            }

        } catch (Exception ex) {
            System.err.println("✗ MongoDB health check failed: " + ex.getMessage());
            ex.printStackTrace();
        }
    }
}
