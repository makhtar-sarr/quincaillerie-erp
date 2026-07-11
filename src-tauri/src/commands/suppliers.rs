// Quincaillerie ERP — Tauri commands for Suppliers CRUD operations.

use rusqlite::params;

use crate::models::Supplier;
use crate::state::AppState;

/// Return every supplier, ordered by name.
#[tauri::command]
pub fn get_suppliers(state: tauri::State<'_, AppState>) -> Result<Vec<Supplier>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, phone, email, address, balance FROM suppliers ORDER BY name")
        .map_err(|e| e.to_string())?;

    let suppliers = stmt
        .query_map([], |row| {
            Ok(Supplier {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                balance: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Supplier>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(suppliers)
}

/// Insert a new supplier. Rejects duplicates on the `id` column.
#[tauri::command]
pub fn add_supplier(
    state: tauri::State<'_, AppState>,
    supplier: Supplier,
) -> Result<Supplier, String> {
    let conn = state.conn()?;

    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM suppliers WHERE id = ?1",
            params![supplier.id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    if exists {
        return Err(format!(
            "Un fournisseur avec l'identifiant '{}' existe déjà.",
            supplier.id
        ));
    }

    conn.execute(
        "INSERT INTO suppliers (id, name, phone, email, address, balance) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            supplier.id,
            supplier.name,
            supplier.phone,
            supplier.email,
            supplier.address,
            supplier.balance,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(supplier)
}

/// Update an existing supplier (matched by id). Returns the updated supplier.
#[tauri::command]
pub fn update_supplier(
    state: tauri::State<'_, AppState>,
    supplier: Supplier,
) -> Result<Supplier, String> {
    let conn = state.conn()?;

    conn.execute(
        "UPDATE suppliers SET name = ?1, phone = ?2, email = ?3, address = ?4, balance = ?5 WHERE id = ?6",
        params![
            supplier.name,
            supplier.phone,
            supplier.email,
            supplier.address,
            supplier.balance,
            supplier.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(supplier)
}

/// Delete a supplier by id.
#[tauri::command]
pub fn delete_supplier(state: tauri::State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;

    conn.execute("DELETE FROM suppliers WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
