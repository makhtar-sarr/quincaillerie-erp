// Quincaillerie ERP — SQLite connection management & migration system.
//
// Uses the `user_version` pragma for schema versioning (see 001_initial.sql).
// WAL mode is enabled for better read/write concurrency; foreign keys are
// turned on explicitly (SQLite does not enable them by default).

use rusqlite::{Connection, OpenFlags};
use std::path::Path;

/// Current schema version. Bump this when adding new migration files.
const SCHEMA_VERSION: i32 = 1;

/// Open (or create) the SQLite database at `path` with production-safe pragmas.
///
/// * `journal_mode=WAL` — better concurrency (readers don't block writers).
/// * `foreign_keys=ON` — enforce FK constraints (off by default in SQLite).
/// * `busy_timeout=5000` — wait up to 5s instead of immediately erroring on a
///   locked database.
pub fn open_db(path: &Path) -> Result<Connection, String> {
    let flags = OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE;
    let conn = Connection::open_with_flags(path, flags).map_err(|e| e.to_string())?;

    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| e.to_string())?;
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| e.to_string())?;
    conn.pragma_update(None, "busy_timeout", 5000)
        .map_err(|e| e.to_string())?;

    Ok(conn)
}

/// Apply pending migrations based on the `user_version` pragma.
///
/// Reads the current version; if it is below the target, executes the bundled
/// migration SQL and sets `user_version` to the new version. Idempotent:
/// re-running on an already-migrated database is a no-op.
pub fn run_migrations(conn: &mut Connection) -> Result<(), String> {
    let current: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if current < SCHEMA_VERSION {
        // Migrations run inside a transaction so a failure leaves the DB clean.
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute_batch(include_str!("../migrations/001_initial.sql"))
            .map_err(|e| e.to_string())?;

        tx.pragma_update(None, "user_version", SCHEMA_VERSION)
            .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    // A shared in-memory DB so tests can exercise the migration path.
    static MEM_DB: OnceLock<Mutex<Connection>> = OnceLock::new();

    fn test_conn() -> &'static Mutex<Connection> {
        MEM_DB.get_or_init(|| {
            // In-memory DB for tests only (forbidden in production code).
            Mutex::new(Connection::open(":memory").expect("open in-memory db"))
        })
    }

    #[test]
    fn migrations_apply_once() {
        let mut conn = test_conn().lock().expect("lock in-memory db");
        run_migrations(&mut conn).expect("first migration run");
        run_migrations(&mut conn).expect("idempotent re-run");

        let version: i32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .expect("read user_version");
        assert_eq!(version, SCHEMA_VERSION);

        // All 10 tables should exist.
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' \
                 AND name IN ('settings','items','customers','suppliers',\
                 'invoices','invoice_items','quotes','quote_items',\
                 'stock_movements','meta')",
                [],
                |r| r.get(0),
            )
            .expect("count tables");
        assert_eq!(count, 10);
    }
}
