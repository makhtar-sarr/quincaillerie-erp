// Quincaillerie ERP — Tauri commands for Invoice (sales) operations.
//
// Invoices are the most consistency-sensitive entity: creating one must
// decrement stock, log SORTIE stock movements, and raise the customer's
// outstanding balance — all atomically. Deleting reverses every effect, and
// converting a quote reuses the same atomic insert path. Every mutation runs
// inside a single SQLite transaction so partial failures leave the DB clean.

use rusqlite::params;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::{Invoice, LineItem};
use crate::state::AppState;

/// Return every invoice, ordered by date (most recent first). Each invoice's
/// line items are loaded from `invoice_items` so the returned `Invoice` is
/// complete.
#[tauri::command]
pub fn get_invoices(state: tauri::State<'_, AppState>) -> Result<Vec<Invoice>, String> {
    let conn = state.conn()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, number, date, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, status, notes, quote_id FROM invoices ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;

    let invoice_rows = stmt
        .query_map([], |row| {
            Ok(Invoice {
                id: row.get(0)?,
                number: row.get(1)?,
                date: row.get(2)?,
                customer_id: row.get(3)?,
                customer_name: row.get(4)?,
                items: Vec::new(),
                subtotal: row.get(5)?,
                discount: row.get(6)?,
                tax: row.get(7)?,
                total: row.get(8)?,
                amount_paid: row.get(9)?,
                payment_method: row.get(10)?,
                status: row.get(11)?,
                notes: row.get(12)?,
                quote_id: row.get(13)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Invoice>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    // Load line items for each invoice.
    let mut invoices = Vec::with_capacity(invoice_rows.len());
    for mut invoice in invoice_rows {
        invoice.items = get_items_for_invoice(&conn, &invoice.id)?;
        invoices.push(invoice);
    }

    Ok(invoices)
}

/// Return the line items belonging to a single invoice.
#[tauri::command]
pub fn get_invoice_items(
    state: tauri::State<'_, AppState>,
    invoice_id: String,
) -> Result<Vec<LineItem>, String> {
    let conn = state.conn()?;
    get_items_for_invoice(&conn, &invoice_id)
}

/// Insert a new invoice together with its line items, decrement stock for each
/// item, log a SORTIE stock movement per line, and raise the customer's
/// outstanding balance. All of this runs inside one transaction so the invoice
/// and the resulting stock/customer state stay consistent.
#[tauri::command]
pub fn add_invoice(
    state: tauri::State<'_, AppState>,
    invoice: Invoice,
) -> Result<Invoice, String> {
    let mut conn = state.conn()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    insert_invoice_tx(&tx, &invoice)?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(invoice)
}

/// Delete an invoice and reverse every side effect of `add_invoice`: restore
/// stock, remove the SORTIE movements, and lower the customer's outstanding
/// balance. All operations run inside a single transaction.
#[tauri::command]
pub fn delete_invoice(
    state: tauri::State<'_, AppState>,
    invoice_id: String,
) -> Result<(), String> {
    let mut conn = state.conn()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Load the invoice (and its items) before deleting, so we can reverse its
    // effects precisely.
    let invoice = load_invoice(&tx, &invoice_id)?;

    // Reverse stock decrements and remove the movements logged for this invoice.
    for item in &invoice.items {
        tx.execute(
            "UPDATE items SET stock_count = stock_count + ?1 WHERE id = ?2",
            params![item.quantity, item.item_id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute(
        "DELETE FROM stock_movements WHERE reference_code = ?1",
        params![invoice.number],
    )
    .map_err(|e| e.to_string())?;

    // Reverse the outstanding-balance change.
    let owed = invoice.total - invoice.amount_paid;
    if owed != 0 {
        tx.execute(
            "UPDATE customers SET outstanding_balance = outstanding_balance - ?1 WHERE id = ?2",
            params![owed, invoice.customer_id],
        )
        .map_err(|e| e.to_string())?;
    }

    // Remove the invoice and its line items (cascade handles invoice_items).
    tx.execute(
        "DELETE FROM invoice_items WHERE invoice_id = ?1",
        params![invoice_id],
    )
    .map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM invoices WHERE id = ?1", params![invoice_id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

/// Convert a quote into a new invoice. Reads the quote and its line items,
/// creates an invoice from that data (reusing the atomic insert path that
/// decrements stock and updates the customer balance), and marks the quote as
/// "Converti". All operations run inside a single transaction.
#[tauri::command]
pub fn convert_quote_to_invoice(
    state: tauri::State<'_, AppState>,
    quote_id: String,
) -> Result<Invoice, String> {
    let mut conn = state.conn()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Load the quote header.
    let quote = tx
        .query_row(
            "SELECT id, number, date, expiry_date, customer_id, customer_name, subtotal, discount, tax, total, status, notes FROM quotes WHERE id = ?1",
            params![quote_id],
            |row| {
                Ok(QuoteLite {
                    id: row.get(0)?,
                    customer_id: row.get(3)?,
                    customer_name: row.get(4)?,
                    subtotal: row.get(6)?,
                    discount: row.get(7)?,
                    tax: row.get(8)?,
                    total: row.get(9)?,
                    status: row.get(10)?,
                    notes: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let items = get_items_for_quote(&tx, &quote_id)?;

    let number = next_invoice_number(&tx, &today())?;
    let invoice = Invoice {
        id: format!("inv-{}", now_ms()),
        number,
        date: today(),
        customer_id: quote.customer_id.clone(),
        customer_name: quote.customer_name.clone(),
        items,
        subtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.tax,
        total: quote.total,
        amount_paid: 0,
        payment_method: String::new(),
        status: "Non Payé".to_string(),
        notes: quote.notes.clone(),
        quote_id: Some(quote.id.clone()),
    };

    insert_invoice_tx(&tx, &invoice)?;

    // Mark the source quote as converted.
    tx.execute(
        "UPDATE quotes SET status = 'Converti' WHERE id = ?1",
        params![quote_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(invoice)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Insert an invoice and apply all of its side effects inside the given
/// transaction: line items, stock decrements, SORTIE movements, and the
/// customer outstanding-balance increase.
fn insert_invoice_tx(
    tx: &rusqlite::Transaction<'_>,
    invoice: &Invoice,
) -> Result<(), String> {
    tx.execute(
        "INSERT INTO invoices (id, number, date, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, status, notes, quote_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            invoice.id,
            invoice.number,
            invoice.date,
            invoice.customer_id,
            invoice.customer_name,
            invoice.subtotal,
            invoice.discount,
            invoice.tax,
            invoice.total,
            invoice.amount_paid,
            invoice.payment_method,
            invoice.status,
            invoice.notes,
            invoice.quote_id,
        ],
    )
    .map_err(|e| e.to_string())?;

    for item in &invoice.items {
        tx.execute(
            "INSERT INTO invoice_items (invoice_id, item_id, item_name, unit, quantity, price, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                invoice.id,
                item.item_id,
                item.item_name,
                item.unit,
                item.quantity,
                item.price,
                item.total,
            ],
        )
        .map_err(|e| e.to_string())?;

        // Decrement stock for the sold item.
        tx.execute(
            "UPDATE items SET stock_count = stock_count - ?1 WHERE id = ?2",
            params![item.quantity, item.item_id],
        )
        .map_err(|e| e.to_string())?;

        // Log a SORTIE movement referencing this invoice number.
        let movement_id = format!("mov-{}-{}", now_ms(), item.item_id);
        tx.execute(
            "INSERT INTO stock_movements (id, item_id, item_name, type, quantity, reason, date, reference_code, operator) VALUES (?1, ?2, ?3, 'SORTIE', ?4, 'Vente Client', ?5, ?6, 'Système')",
            params![
                movement_id,
                item.item_id,
                item.item_name,
                item.quantity,
                invoice.date,
                invoice.number,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Raise the customer's outstanding balance by the unpaid amount.
    let owed = invoice.total - invoice.amount_paid;
    if owed != 0 {
        tx.execute(
            "UPDATE customers SET outstanding_balance = outstanding_balance + ?1 WHERE id = ?2",
            params![owed, invoice.customer_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Load a full invoice (header + line items) from within a transaction.
fn load_invoice(
    tx: &rusqlite::Transaction<'_>,
    invoice_id: &str,
) -> Result<Invoice, String> {
    let invoice = tx
        .query_row(
            "SELECT id, number, date, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, status, notes, quote_id FROM invoices WHERE id = ?1",
            params![invoice_id],
            |row| {
                Ok(Invoice {
                    id: row.get(0)?,
                    number: row.get(1)?,
                    date: row.get(2)?,
                    customer_id: row.get(3)?,
                    customer_name: row.get(4)?,
                    items: Vec::new(),
                    subtotal: row.get(5)?,
                    discount: row.get(6)?,
                    tax: row.get(7)?,
                    total: row.get(8)?,
                    amount_paid: row.get(9)?,
                    payment_method: row.get(10)?,
                    status: row.get(11)?,
                    notes: row.get(12)?,
                    quote_id: row.get(13)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut invoice = invoice;
    invoice.items = get_items_for_invoice(tx, &invoice.id)?;
    Ok(invoice)
}

/// Helper: load the line items for an invoice from `invoice_items`.
fn get_items_for_invoice(
    conn: &rusqlite::Connection,
    invoice_id: &str,
) -> Result<Vec<LineItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT item_id, item_name, unit, quantity, price, total FROM invoice_items WHERE invoice_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![invoice_id], |row| {
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

/// Minimal quote projection used by `convert_quote_to_invoice`.
struct QuoteLite {
    id: String,
    customer_id: String,
    customer_name: String,
    subtotal: i64,
    discount: i64,
    tax: i64,
    total: i64,
    status: String,
    notes: Option<String>,
}

/// Compute the next sequential invoice number (`FAC-YYYY-NNN`) for the year of
/// `date`, mirroring the logic in `commands/numbering.rs`.
fn next_invoice_number(
    conn: &rusqlite::Connection,
    date: &str,
) -> Result<String, String> {
    let year = date
        .split('-')
        .next()
        .filter(|y| y.len() == 4 && y.chars().all(|c| c.is_ascii_digit()))
        .ok_or_else(|| format!("Format de date invalide: '{}'", date))?;

    let substr_start = ("FAC".len() + 1 + year.len() + 1 + 1) as i32;
    let like_pattern = format!("FAC-{}-%", year);

    let max_num: Option<i64> = conn
        .query_row(
            "SELECT MAX(CAST(SUBSTR(number, ?1) AS INTEGER)) FROM invoices WHERE number LIKE ?2",
            params![substr_start, like_pattern],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let next = max_num.unwrap_or(0) + 1;
    Ok(format!("FAC-{}-{}", year, format!("{:03}", next)))
}

/// Current date as `YYYY-MM-DD` (local-agnostic, derived from the system clock).
fn today() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let days = secs / 86400;
    // 1970-01-01 is day 0; compute year/month/day via a simple civil algorithm.
    civil_date_from_days(days as i64)
}

/// Monotonic millisecond timestamp, used for unique IDs.
fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

/// Convert a count of days since 1970-01-01 into a `YYYY-MM-DD` string using
/// Howard Hinnant's `days_from_civil` inverse.
fn civil_date_from_days(z: i64) -> String {
    let z = z + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{:04}-{:02}-{:02}", y, m, d)
}
