Hotel database resources

This folder contains PostgreSQL Flyway migrations and MongoDB bootstrap files
for the hotel management system.

Structure
- migration/: compact Flyway SQL files split by responsibility
- mongodb/: manual Mongo bootstrap scripts

PostgreSQL migration map
1. V0__schema_prerequisites.sql: PostgreSQL extension + enum prerequisites.
2. V1__baseline_schema.sql: core table definitions only.
3. V2__triggers.sql: updated_at + audit triggers.
4. V3__functions.sql: reusable SQL functions.
5. V4__procedures.sql: stored procedures.
6. V5__cte.sql: CTE-based analytical views.
7. V6__views.sql: standard views without CTEs.
8. V7__seed_data.sql: optional sample data for local/demo environments.
9. V8__table_constraints.sql: constraints that depend on baseline tables.

Notes
- Baseline stays limited to table creation; later files layer triggers,
	 functions, procedures, CTE views, plain views, seed data, and constraints.
- For existing databases that already applied legacy scripts, recreate the
	 database before migrating with this compact layout.

MongoDB notes
- `mongodb/init-hotel.js`: manual idempotent seed/bootstrap script for MongoDB
	- Creates collections: `sessions`, `verification_tokens`, `feedbacks`, `activity_logs`, `room_cache`, `hotel_catalogs`, `customer_settings`.
	- Adds TTL indexes for `sessions.expires_at` and `verification_tokens.expires_at`.
	- Seed data is idempotent and intended for local/demo environments only.
	- The backend `FeedbackDocument` is mapped to the `feedbacks` collection and repository-level aggregations use this collection.

