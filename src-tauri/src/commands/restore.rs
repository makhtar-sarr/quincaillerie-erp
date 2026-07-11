// Quincaillerie ERP — Tauri command for full data restore.
//
// `restore_all` replaces the entire local dataset with the contents of a
// `RestoreData` payload (typically produced by a cloud backup). It first clears
// every table, then re-inserts all entities — settings, items, stock
// movements, customers, suppliers, quotes (with line items), and invoices (with
// line items) — inside a single SQLite transaction so the operation is atomic.
// A failure at any point rolls back the whole restore, leaving the existing
// data intact.

use rusqlite::params;

use crate::models::RestoreData;
use crate::state::AppState;

/// Replace all local data with the contents of `data`.
///
/// The restore is atomic: every DELETE and INSERT runs inside one transaction.
/// On any error the transaction is rolled back and the previous data remains
/// untouched. The settings table holds a single row (id = 1).
#[tauri::command]
pub fn restore_all(
    state: tauri::State<'_, AppState>,
    data: RestoreData,
) -> Result<(), String> {
    let mut conn = state.conn()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Clear existing data. Child tables (invoice_items, quote_items) are
    //    cleared first to respect foreign-key ordering, then the parents.
    tx.execute("DELETE FROM invoice_items", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM quote_items", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM stock_movements", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM invoices", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM quotes", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM customers", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM suppliers", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM items", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM settings", [])
        .map_err(|e| e.to_string())?;

    // 2. Restore settings (single row, id = 1).
    let s = &data.settings;
    tx.execute(
        "INSERT INTO settings (id, store_name, address, phone, email, ninea, rc, tva_rate, currency) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            s.store_name,
            s.address,
            s.phone,
            s.email,
            s.ninea,
            s.rc,
            s.tva_rate,
            s.currency,
        ],
    )
    .map_err(|e| e.to_string())?;

    // 3. Restore items.
    for item in &data.items {
        tx.execute(
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
    }

    // 4. Restore stock movements.
    for m in &data.movements {
        tx.execute(
            "INSERT INTO stock_movements (id, item_id, item_name, type, quantity, reason, date, reference_code, operator) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                m.id,
                m.item_id,
                m.item_name,
                m.type_,
                m.quantity,
                m.reason,
                m.date,
                m.reference_code,
                m.operator,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // 5. Restore customers.
    for c in &data.customers {
        tx.execute(
            "INSERT INTO customers (id, name, phone, email, address, company, outstanding_balance) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                c.id,
                c.name,
                c.phone,
                c.email,
                c.address,
                c.company,
                c.outstanding_balance,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // 6. Restore suppliers.
    for sp in &data.suppliers {
        tx.execute(
            "INSERT INTO suppliers (id, name, phone, email, address, balance) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                sp.id,
                sp.name,
                sp.phone,
                sp.email,
                sp.address,
                sp.balance,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // 7. Restore quotes and their line items.
    for q in &data.quotes {
        tx.execute(
            "INSERT INTO quotes (id, number, date, expiry_date, customer_id, customer_name, subtotal, discount, tax, total, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                q.id,
                q.number,
                q.date,
                q.expiry_date,
                q.customer_id,
                q.customer_name,
                q.subtotal,
                q.discount,
                q.tax,
                q.total,
                q.status,
                q.notes,
            ],
        )
        .map_err(|e| e.to_string())?;

        for li in &q.items {
            tx.execute(
                "INSERT INTO quote_items (quote_id, item_id, item_name, unit, quantity, price, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    q.id,
                    li.item_id,
                    li.item_name,
                    li.unit,
                    li.quantity,
                    li.price,
                    li.total,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // 8. Restore invoices and their line items.
    for inv in &data.invoices {
        tx.execute(
            "INSERT INTO invoices (id, number, date, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, status, notes, quote_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                inv.id,
                inv.number,
                inv.date,
                inv.customer_id,
                inv.customer_name,
                inv.subtotal,
                inv.discount,
                inv.tax,
                inv.total,
                inv.amount_paid,
                inv.payment_method,
                inv.status,
                inv.notes,
                inv.quote_id,
            ],
        )
        .map_err(|e| e.to_string())?;

        for li in &inv.items {
            tx.execute(
                "INSERT INTO invoice_items (invoice_id, item_id, item_name, unit, quantity, price, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    inv.id,
                    li.item_id,
                    li.item_name,
                    li.unit,
                    li.quantity,
                    li.price,
                    li.total,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
