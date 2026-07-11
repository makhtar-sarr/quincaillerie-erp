// Quincaillerie ERP — Tauri application state.
//
// `AppState` owns the single SQLite connection. Tauri runs command handlers on
// arbitrary threads, so the connection is guarded by a `Mutex`. WAL mode
// already allows concurrent readers, so one connection (no `Arc`) suffices;
// Tauri's `State` owns the lifetime.

use rusqlite::Connection;
use std::path::Path;
use std::sync::{Mutex, MutexGuard};

use crate::db;

/// Shared application state managed by Tauri via `.manage()`.
pub struct AppState {
    conn: Mutex<Connection>,
}

impl AppState {
    /// Open the database at `path` and apply any pending migrations.
    pub fn new(path: &Path) -> Result<Self, String> {
        let mut conn = db::open_db(path)?;
        db::run_migrations(&mut conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Lock the mutex and return a guard to the connection.
    ///
    /// The guard must be held for the duration of DB access; callers use it
    /// within the same scope (e.g. `let conn = state.conn()?;`).
    pub fn conn(&self) -> Result<MutexGuard<'_, Connection>, String> {
        self.conn.lock().map_err(|e| e.to_string())
    }
}
