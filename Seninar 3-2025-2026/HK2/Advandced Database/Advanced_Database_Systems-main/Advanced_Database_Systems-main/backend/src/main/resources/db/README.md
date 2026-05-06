Hotel database resources

This folder contains PostgreSQL Flyway migrations and MongoDB bootstrap files
for the hotel management system.

Structure
- migration/: compact Flyway SQL files (baseline + seed)
- mongodb/: collection/index/sample definitions for local bootstrap

PostgreSQL migration map
1. V0__schema_prerequisites.sql: PostgreSQL extension + enum prerequisites.
2. V1__baseline_schema.sql: core table definitions only.
3. V1_1__table_constraints.sql: table-level constraints that depend on prior tables.
4. V2__triggers.sql: updated_at + audit triggers.
5. V3__functions.sql: reusable SQL functions.
6. V4__procedures.sql: stored procedures.
7. V5__cte.sql: executable CTE-based analytical views.
8. V6__views.sql: standard views for hierarchy, showcases, and ranking.
9. V7__seed_data.sql: optional sample data for local/demo environments.

Notes
- This layout is intentionally separated by responsibility so each file has a
	 single purpose and is easier to review.
- For existing databases that already applied legacy V1..V13 scripts, recreate
	 the database before migrating with this compact layout.

MongoDB notes
- collections.json: expected document collections
- indexes.json: index definitions, including TTL indexes
- seed.json: sample documents for local development

