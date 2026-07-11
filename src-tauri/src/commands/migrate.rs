// Quincaillerie ERP — Tauri command for one-shot localStorage → SQLite migration.
//
// `migrate_local_storage` imports the data previously held in the browser's
// localStorage (the 7-key backup: settings, items, movements, customers,
// suppliers, quotes, invoices) into SQLite. It is idempotent: a `meta` flag
// (`migrated = 1`) marks completion, so repeated calls are no-ops. The import
// runs inside a single SQLite transaction so a failure leaves the database
// untouched.

use rusqlite::params;

use crate::models::StoreState;
use crate::state::AppState;

/// Import localStorage data into SQLite exactly once.
///
/// Returns `Ok(true)` when the migration ran, `Ok(false)` when it had already
/// been performed. The whole import is atomic: every DELETE and INSERT runs
/// inside one transaction, and the `meta.migrated` flag is set only on commit.
#[tauri::command]
pub fn migrate_local_storage(
    state: tauri::State<'_, AppState>,
    payload: StoreState,
) -> Result<bool, String> {
    let mut conn = state.conn()?;

    // 1. Bail out early if a migration already completed.
    let already_migrated: bool = conn
        .query_row(
            "SELECT value FROM meta WHERE key = 'migrated'",
            [],
            |row| row.get::<_, String>(0).map(|v| v == "1"),
        )
        .unwrap_or(false);
    if already_migrated {
        return Ok(false);
    }

    // 2. Import inside a single transaction.
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 2a. Clear existing data. Child tables first to respect foreign keys.
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

    // 2b. Insert settings (single row, id = 1).
    let s = &payload.settings;
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

    // 2c. Insert items.
    for item in &payload.items {
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

    // 2d. Insert stock movements.
    for m in &payload.movements {
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

    // 2e. Insert customers.
    for c in &payload.customers {
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

    // 2f. Insert suppliers.
    for sp in &payload.suppliers {
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

    // 2g. Insert quotes and their line items.
    for q in &payload.quotes {
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

    // 2h. Insert invoices and their line items.
    for inv in &payload.invoices {
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

    // 2i. Mark migration complete.
    tx.execute(
        "INSERT INTO meta (key, value) VALUES ('migrated', '1') ON CONFLICT(key) DO UPDATE SET value = '1'",
        [],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(true)
}
