Backend resources index

This directory is intentionally compact and grouped by runtime concern.

Folders
- db/: PostgreSQL migrations and MongoDB bootstrap files
- templates/: HTML email templates

Top-level files
- application.yml: base config shared across profiles
- application-dev.yml: dev overrides
- application-prod.yml: production overrides
- logback-spring.xml: logging configuration

Conventions
- Keep SQL migrations only in db/migration with sequential Flyway versions.
- Keep Mongo bootstrap artifacts only in db/mongodb.
- Keep email HTML templates only in templates.
- Avoid adding environment-specific secrets directly into YAML files.
