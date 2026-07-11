// Quincaillerie ERP — Tauri commands for Items CRUD operations.

use rusqlite::params;

use crate::models::Item;
use crate::state::AppState;

/// Return every item in the catalogue, ordered by name.
#[tauri::command]
pub fn get_items(state: tauri::State<'_, AppState>) -> Result<Vec<Item>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, ref, category, unit, min_stock, stock_count, buying_price, selling_price, description FROM items ORDER BY name")
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([], |row| {
            Ok(Item {
                id: row.get(0)?,
                name: row.get(1)?,
                ref_: row.get(2)?,
                category: row.get(3)?,
                unit: row.get(4)?,
                min_stock: row.get(5)?,
                stock_count: row.get(6)?,
                buying_price: row.get(7)?,
                selling_price: row.get(8)?,
                description: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Item>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

/// Insert a new item. Rejects duplicates on the `ref` (SKU) column.
#[tauri::command]
pub fn add_item(state: tauri::State<'_, AppState>, item: Item) -> Result<Item, String> {
    let conn = state.conn()?;

    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM items WHERE ref = ?1",
            params![item.ref_],
            |_| Ok(true),
        )
        .unwrap_or(false);
    if exists {
        return Err(format!(
            "Un article avec la référence '{}' existe déjà.",
            item.ref_
        ));
    }

    conn.execute(
        "INSERT INTO items (id, name, ref, category, unit, min_stock, stock_count, buying_price, selling_price, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            item.id,
            item.name,
            item.ref_,
            item.category,
            item.unit,
            item.min_stock,
            item.stock_count,
            item.buying_price,
            item.selling_price,
            item.description,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(item)
}

/// Update an existing item (matched by id). Returns the updated item.
#[tauri::command]
pub fn update_item(state: tauri::State<'_, AppState>, item: Item) -> Result<Item, String> {
    let conn = state.conn()?;

    conn.execute(
        "UPDATE items SET name = ?1, ref = ?2, category = ?3, unit = ?4, min_stock = ?5, stock_count = ?6, buying_price = ?7, selling_price = ?8, description = ?9 WHERE id = ?10",
        params![
            item.name,
            item.ref_,
            item.category,
            item.unit,
            item.min_stock,
            item.stock_count,
            item.buying_price,
            item.selling_price,
            item.description,
            item.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(item)
}

/// Delete an item by id.
#[tauri::command]
pub fn delete_item(state: tauri::State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;

    conn.execute("DELETE FROM items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
