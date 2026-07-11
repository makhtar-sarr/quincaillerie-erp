// Quincaillerie ERP — Tauri commands for Quotes (devis) CRUD operations
// and quote_items line-item management.

use rusqlite::params;

use crate::models::{LineItem, Quote};
use crate::state::AppState;

/// Return every quote, ordered by date (most recent first). Each quote's
/// line items are loaded from `quote_items` so the returned `Quote` is complete.
#[tauri::command]
pub fn get_quotes(state: tauri::State<'_, AppState>) -> Result<Vec<Quote>, String> {
    let conn = state.conn()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, number, date, expiry_date, customer_id, customer_name, subtotal, discount, tax, total, status, notes FROM quotes ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;

    let quote_rows = stmt
        .query_map([], |row| {
            Ok(Quote {
                id: row.get(0)?,
                number: row.get(1)?,
                date: row.get(2)?,
                expiry_date: row.get(3)?,
                customer_id: row.get(4)?,
                customer_name: row.get(5)?,
                items: Vec::new(),
                subtotal: row.get(6)?,
                discount: row.get(7)?,
                tax: row.get(8)?,
                total: row.get(9)?,
                status: row.get(10)?,
                notes: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Quote>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    // Load line items for each quote.
    let mut quotes = Vec::with_capacity(quote_rows.len());
    for mut quote in quote_rows {
        quote.items = get_items_for_quote(&conn, &quote.id)?;
        quotes.push(quote);
    }

    Ok(quotes)
}

/// Return the line items belonging to a single quote.
#[tauri::command]
pub fn get_quote_items(
    state: tauri::State<'_, AppState>,
    quote_id: String,
) -> Result<Vec<LineItem>, String> {
    let conn = state.conn()?;
    get_items_for_quote(&conn, &quote_id)
}

/// Insert a new quote together with its line items. Both writes run inside a
/// single transaction so the quote and its items stay consistent.
#[tauri::command]
pub fn add_quote(state: tauri::State<'_, AppState>, quote: Quote) -> Result<Quote, String> {
    let mut conn = state.conn()?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO quotes (id, number, date, expiry_date, customer_id, customer_name, subtotal, discount, tax, total, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            quote.id,
            quote.number,
            quote.date,
            quote.expiry_date,
            quote.customer_id,
            quote.customer_name,
            quote.subtotal,
            quote.discount,
            quote.tax,
            quote.total,
            quote.status,
            quote.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    for item in &quote.items {
        tx.execute(
            "INSERT INTO quote_items (quote_id, item_id, item_name, unit, quantity, price, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                quote.id,
                item.item_id,
                item.item_name,
                item.unit,
                item.quantity,
                item.price,
                item.total,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(quote)
}

/// Update the status of a quote (e.g. Brouillon → Envoyé → Accepté → Expiré).
#[tauri::command]
pub fn update_quote_status(
    state: tauri::State<'_, AppState>,
    quote_id: String,
    status: String,
) -> Result<(), String> {
    let conn = state.conn()?;

    conn
        .execute(
            "UPDATE quotes SET status = ?1 WHERE id = ?2",
            params![status, quote_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Delete a quote and all of its line items. Both deletes run inside a single
/// transaction so the quote and its items stay consistent.
#[tauri::command]
pub fn delete_quote(state: tauri::State<'_, AppState>, quote_id: String) -> Result<(), String> {
    let mut conn = state.conn()?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM quote_items WHERE quote_id = ?1", params![quote_id])
        .map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM quotes WHERE id = ?1", params![quote_id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

/// Helper: load the line items for a quote from `quote_items`.
fn get_items_for_quote(
    conn: &rusqlite::Connection,
    quote_id: &str,
) -> Result<Vec<LineItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT item_id, item_name, unit, quantity, price, total FROM quote_items WHERE quote_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![quote_id], |row| {
            Ok(LineItem {
                item_id: row.get(0)?,
                item_name: row.get(1)?,
                unit: row.get(2)?,
                quantity: row.get(3)?,
                price: row.get(4)?,
                total: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<LineItem>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}
