Hotel database resources

This folder contains PostgreSQL Flyway migrations and MongoDB bootstrap files
for the hotel management system.

Structure
- migration/: compact Flyway SQL files (baseline + seed)
- mongodb/: collection/index/sample definitions for local bootstrap

PostgreSQL migration map
1. V1__baseline_schema.sql: production-ready baseline that consolidates schema,
	 views, routines, indexes, permissions, booking lifecycle updates, conflict
	 enforcement, and event outbox/saga structures.
2. V2__seed_data.sql: optional sample data for local/demo environments.

Notes
- This layout is intentionally minimal to keep migrations practical and easier
	to review in team projects.
- For existing databases that already applied legacy V1..V13 scripts, recreate
	the database before migrating with this compact layout.

MongoDB notes
- collections.json: expected document collections
- indexes.json: index definitions, including TTL indexes
- seed.json: sample documents for local development

