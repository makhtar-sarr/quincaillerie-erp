// Quincaillerie ERP — Tauri commands for Stock movements CRUD operations.

use rusqlite::params;

use crate::models::StockMovement;
use crate::state::AppState;

/// Return every stock movement, ordered by date (most recent first).
#[tauri::command]
pub fn get_movements(state: tauri::State<'_, AppState>) -> Result<Vec<StockMovement>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, item_id, item_name, type, quantity, reason, date, reference_code, operator FROM stock_movements ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let movements = stmt
        .query_map([], |row| {
            Ok(StockMovement {
                id: row.get(0)?,
                item_id: row.get(1)?,
                item_name: row.get(2)?,
                type_: row.get(3)?,
                quantity: row.get(4)?,
                reason: row.get(5)?,
                date: row.get(6)?,
                reference_code: row.get(7)?,
                operator: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<StockMovement>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(movements)
}

/// Insert a new stock movement. Returns the inserted movement.
#[tauri::command]
pub fn add_movement(
    state: tauri::State<'_, AppState>,
    movement: StockMovement,
) -> Result<StockMovement, String> {
    let conn = state.conn()?;

    conn.execute(
        "INSERT INTO stock_movements (id, item_id, item_name, type, quantity, reason, date, reference_code, operator) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            movement.id,
            movement.item_id,
            movement.item_name,
            movement.type_,
            movement.quantity,
            movement.reason,
            movement.date,
            movement.reference_code,
            movement.operator,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(movement)
}
