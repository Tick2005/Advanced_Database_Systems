Hotel database resources

This folder contains PostgreSQL Flyway migrations and MongoDB bootstrap files
for the hotel management system.

Structure
- migration/: ordered Flyway SQL files (V1, V2, ...)
- mongodb/: collection/index/sample definitions for local bootstrap

PostgreSQL migration map
1. V1: core schema (types, tables, constraints)
2. V2: reporting views
3. V3: routines and triggers
4. V4: sample seed data
5. V5: index optimization
6. V6: permission grants
7. V7: pricing request module
8. V8: booking status check-in/check-out update
9. V9: user branch assignment mapping for JWT branch scope

MongoDB notes
- collections.json: expected document collections
- indexes.json: index definitions, including TTL indexes
- seed.json: sample documents for local development

