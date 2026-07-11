// Quincaillerie ERP — Tauri commands for the audit trail.
//
// The audit log records operator actions (create/update/delete on entities) for
// accountability. In Tauri mode entries are persisted in the `audit_log` SQLite
// table created by migration 002; the web/localStorage fallback (handled in
// storageAdapter.ts) is advisory-only and not tamper-proof.

use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::state::AppState;

/// A single audit-trail entry.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub ts: String,
    pub operator: String,
    pub action: String,
    pub entity: String,
    pub entity_id: Option<String>,
    pub detail: Option<String>,
}

/// Append a new audit entry to the `audit_log` table.
#[tauri::command]
pub fn add_audit_entry(
    state: tauri::State<'_, AppState>,
    entry: AuditEntry,
) -> Result<AuditEntry, String> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO audit_log (id, ts, operator, action, entity, entity_id, detail) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            entry.id,
            entry.ts,
            entry.operator,
            entry.action,
            entry.entity,
            entry.entity_id,
            entry.detail,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(entry)
}

/// Return the full audit log ordered by timestamp (most recent first).
#[tauri::command]
pub fn get_audit_log(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<AuditEntry>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, ts, operator, action, entity, entity_id, detail FROM audit_log ORDER BY ts DESC",
        )
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| {
            Ok(AuditEntry {
                id: row.get(0)?,
                ts: row.get(1)?,
                operator: row.get(2)?,
                action: row.get(3)?,
                entity: row.get(4)?,
                entity_id: row.get(5)?,
                detail: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<AuditEntry>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}
