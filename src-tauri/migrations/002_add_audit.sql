-- Quincaillerie ERP — Audit trail migration
-- Migration 002: create the `audit_log` table.
-- Conventions (same as 001_initial.sql):
--   * IDs and timestamps are TEXT (ISO 8601 strings, prefix-uuid IDs)
--   * Option<String> fields are nullable; other strings default to ''
--   * Table uses IF NOT EXISTS for idempotent re-runs
--   * Schema version is tracked via the `user_version` pragma (set by db.rs)

-- ---------------------------------------------------------------------------
-- audit_log (operator action trail for accountability)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  ts          TEXT NOT NULL DEFAULT '',   -- ISO 8601 timestamp of the action
  operator    TEXT NOT NULL DEFAULT '',   -- who performed the action
  action      TEXT NOT NULL DEFAULT '',   -- e.g. 'create', 'update', 'delete'
  entity      TEXT NOT NULL DEFAULT '',   -- e.g. 'invoice', 'item', 'customer'
  entity_id   TEXT,                        -- id of the affected entity (nullable)
  detail      TEXT                         -- free-form context (nullable)
);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log (ts);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log (entity);
CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON audit_log (operator);
