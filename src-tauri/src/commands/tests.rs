// Quincaillerie ERP — Backend test suite.
//
// Exercises the Tauri command layer (CRUD, numbering, atomic restore) against an
// isolated in-memory SQLite database. Each test gets a fresh `:memory:` database
// via `TestDb`, so tests never share state.
//
// The command functions are `#[tauri::command]`s that take a `tauri::State`
// wrapper. We construct that wrapper with `tauri::State::from(&app_state)`, which
// is the supported way to invoke commands outside of the Tauri runtime.

#![cfg(test)]

use rusqlite::{params, Connection};
use std::path::Path;
use tauri::test::MockRuntime;
use tauri::App;
use tauri::Manager;

use crate::models::*;
use crate::state::AppState;

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/// Build an isolated mock Tauri app backed by an in-memory SQLite database.
///
/// `:memory:` databases are private to the single connection held by `AppState`,
/// so every app is fully isolated from every other test. The `test` feature's
/// `MockRuntime` lets us construct `State` via `Manager::state` without a real
/// webview/display.
fn test_app() -> App<MockRuntime> {
    let app_state = AppState::new(Path::new(":memory:"))
        .expect("failed to open in-memory database");
    tauri::test::mock_builder()
        .manage(app_state)
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .expect("failed to build mock app")
}

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

fn make_item(id: &str, ref_: &str) -> Item {
    Item {
        id: id.to_string(),
        name: format!("Article {}", id),
        ref_: ref_.to_string(),
        category: "Quincaillerie".to_string(),
        unit: "Unité".to_string(),
        min_stock: 5,
        stock_count: 100,
        buying_price: 1000,
        selling_price: 1500,
        description: None,
    }
}

fn make_customer(id: &str) -> Customer {
    Customer {
        id: id.to_string(),
        name: format!("Client {}", id),
        phone: "771234567".to_string(),
        email: None,
        address: None,
        company: None,
        outstanding_balance: 0,
    }
}

fn make_supplier(id: &str) -> Supplier {
    Supplier {
        id: id.to_string(),
        name: format!("Fournisseur {}", id),
        phone: "771234567".to_string(),
        email: None,
        address: None,
        balance: 0,
    }
}

fn make_settings() -> StoreSettings {
    StoreSettings {
        store_name: "Boutique Test".to_string(),
        address: "Dakar".to_string(),
        phone: "331234567".to_string(),
        email: "test@example.com".to_string(),
        ninea: "NINEA123".to_string(),
        rc: "RC456".to_string(),
        tva_rate: 18,
        currency: "FCFA".to_string(),
    }
}

/// Build a `RestoreData` payload from the given items (other collections empty).
fn make_restore(items: Vec<Item>) -> RestoreData {
    RestoreData {
        settings: make_settings(),
        items,
        movements: vec![],
        customers: vec![],
        suppliers: vec![],
        quotes: vec![],
        invoices: vec![],
    }
}

/// Insert a raw invoice row (only the columns `get_next_number` reads matter).
fn seed_invoice_number(conn: &Connection, number: &str) {
    conn.execute(
        "INSERT INTO invoices (id, number, date, customer_id, customer_name, subtotal, discount, tax, total, amount_paid, payment_method, status, notes, quote_id) VALUES (?1, ?2, '2026-01-01', 'c1', 'Client', 0, 0, 0, 0, 0, '', '', NULL, NULL)",
        params![format!("inv-{}", number), number],
    )
    .expect("seed invoice number");
}

/// Insert a raw quote row (only the `number` column matters for numbering).
fn seed_quote_number(conn: &Connection, number: &str) {
    conn.execute(
        "INSERT INTO quotes (id, number, date, expiry_date, customer_id, customer_name, subtotal, discount, tax, total, status, notes) VALUES (?1, ?2, '2026-01-01', '2026-02-01', 'c1', 'Client', 0, 0, 0, 0, '', '')",
        params![format!("q-{}", number), number],
    )
    .expect("seed quote number");
}

// ---------------------------------------------------------------------------
// Transaction atomicity tests
// ---------------------------------------------------------------------------

#[test]
fn restore_commits_all_data_on_success() {
    let app = test_app();

    let data = make_restore(vec![
        make_item("i1", "R1"),
        make_item("i2", "R2"),
        make_item("i3", "R3"),
    ]);

    let result = crate::commands::restore::restore_all(app.state::<AppState>(), data);
    assert!(result.is_ok(), "restore should succeed: {:?}", result);

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 3, "all three items should be committed");

    let settings = crate::commands::settings::get_settings(app.state::<AppState>()).expect("get_settings");
    assert_eq!(settings.store_name, "Boutique Test");
}

#[test]
fn restore_rolls_back_entire_operation_on_failure() {
    let app = test_app();

    // Seed the DB with a pre-existing item so we can detect a rollback.
    {
        let st = app.state::<AppState>();
        let conn = st.conn().expect("lock conn");
        conn
            .execute(
                "INSERT INTO items (id, name, ref, category, unit, min_stock, stock_count, buying_price, selling_price, description) VALUES (?1, ?2, ?3, '', '', 0, 0, 0, 0, NULL)",
                params!["seed", "Article seed", "SEED"],
            )
            .expect("seed pre-existing item");
    }

    // A payload with two items sharing the same primary key must fail mid-insert.
    let bad_data = make_restore(vec![
        make_item("dup", "A"),
        make_item("dup", "B"), // duplicate id -> PRIMARY KEY violation
    ]);

    let result = crate::commands::restore::restore_all(app.state::<AppState>(), bad_data);
    assert!(result.is_err(), "restore with duplicate id must fail");

    // Rollback must leave the pre-existing item intact and the duplicates absent.
    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 1, "rollback must preserve the original row");
    assert_eq!(items[0].id, "seed");

    // Settings must also be untouched (the DELETE/INSERT of settings rolled back).
    let settings = crate::commands::settings::get_settings(app.state::<AppState>()).expect("get_settings");
    assert_eq!(settings.store_name, "", "settings should be empty after rollback");
}

// ---------------------------------------------------------------------------
// Numbering tests
// ---------------------------------------------------------------------------

#[test]
fn numbering_starts_at_one_when_empty() {
    let app = test_app();
    let next = crate::commands::numbering::get_next_number(app.state::<AppState>(), "FAC".into(), "2026-06-15".into())
        .expect("next number");
    assert_eq!(next, "FAC-2026-001");
}

#[test]
fn numbering_increments_after_existing() {
    let app = test_app();
    {
        let st = app.state::<AppState>();
        let conn = st.conn().expect("lock conn");
        seed_invoice_number(&conn, "FAC-2026-001");
        seed_invoice_number(&conn, "FAC-2026-002");
    }

    let next = crate::commands::numbering::get_next_number(app.state::<AppState>(), "FAC".into(), "2026-06-15".into())
        .expect("next number");
    assert_eq!(next, "FAC-2026-003");
}

#[test]
fn numbering_respects_year_boundary() {
    let app = test_app();
    {
        let st = app.state::<AppState>();
        let conn = st.conn().expect("lock conn");
        // Existing numbers span two different years.
        seed_invoice_number(&conn, "FAC-2025-005");
        seed_invoice_number(&conn, "FAC-2026-007");
    }

    // A 2026 document continues the 2026 sequence.
    let next_2026 = crate::commands::numbering::get_next_number(app.state::<AppState>(), "FAC".into(), "2026-03-01".into())
        .expect("next 2026 number");
    assert_eq!(next_2026, "FAC-2026-008");

    // A 2025 document continues the 2025 sequence independently.
    let next_2025 = crate::commands::numbering::get_next_number(app.state::<AppState>(), "FAC".into(), "2025-12-01".into())
        .expect("next 2025 number");
    assert_eq!(next_2025, "FAC-2025-006");
}

#[test]
fn numbering_works_for_quotes_too() {
    let app = test_app();
    {
        let st = app.state::<AppState>();
        let conn = st.conn().expect("lock conn");
        seed_quote_number(&conn, "DEV-2026-004");
    }

    let next = crate::commands::numbering::get_next_number(app.state::<AppState>(), "DEV".into(), "2026-09-09".into())
        .expect("next quote number");
    assert_eq!(next, "DEV-2026-005");
}

#[test]
fn numbering_rejects_unknown_prefix() {
    let app = test_app();
    let result = crate::commands::numbering::get_next_number(app.state::<AppState>(), "XYZ".into(), "2026-01-01".into());
    assert!(result.is_err(), "unknown prefix must be rejected");
}

#[test]
fn numbering_rejects_invalid_date() {
    let app = test_app();
    let result = crate::commands::numbering::get_next_number(app.state::<AppState>(), "FAC".into(), "not-a-date".into());
    assert!(result.is_err(), "invalid date must be rejected");
}

// ---------------------------------------------------------------------------
// Items CRUD tests
// ---------------------------------------------------------------------------

#[test]
fn item_crud_add_get_update_delete() {
    let app = test_app();

    let item = make_item("i1", "R1");
    let added = crate::commands::items::add_item(app.state::<AppState>(), item.clone()).expect("add_item");
    assert_eq!(added.id, "i1");

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].name, "Article i1");

    let mut updated = items[0].clone();
    updated.name = "Article modifié".into();
    updated.selling_price = 2000;
    let result = crate::commands::items::update_item(app.state::<AppState>(), updated.clone()).expect("update_item");
    assert_eq!(result.selling_price, 2000);

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].name, "Article modifié");
    assert_eq!(items[0].selling_price, 2000);

    crate::commands::items::delete_item(app.state::<AppState>(), "i1".into()).expect("delete_item");
    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 0, "item should be gone after delete");
}

#[test]
fn item_add_rejects_duplicate_ref() {
    let app = test_app();
    crate::commands::items::add_item(app.state::<AppState>(), make_item("i1", "R1")).expect("first add");

    let dup = make_item("i2", "R1");
    let result = crate::commands::items::add_item(app.state::<AppState>(), dup);
    assert!(result.is_err(), "duplicate ref must be rejected");

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 1, "only the first item should exist");
}

#[test]
fn item_delete_missing_is_noop() {
    let app = test_app();
    crate::commands::items::add_item(app.state::<AppState>(), make_item("i1", "R1")).expect("add");

    let result = crate::commands::items::delete_item(app.state::<AppState>(), "nope".into());
    assert!(result.is_ok(), "delete of missing id should be a no-op");

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 1, "existing item must remain");
}

#[test]
fn item_update_missing_is_noop() {
    let app = test_app();
    let result = crate::commands::items::update_item(app.state::<AppState>(), make_item("ghost", "R9"));
    assert!(result.is_ok(), "update of missing id should be a no-op");

    let items = crate::commands::items::get_items(app.state::<AppState>()).expect("get_items");
    assert_eq!(items.len(), 0, "no row should be created by a missing update");
}

// ---------------------------------------------------------------------------
// Customers CRUD tests
// ---------------------------------------------------------------------------

#[test]
fn customer_crud_add_get_update_delete() {
    let app = test_app();

    let customer = make_customer("c1");
    crate::commands::customers::add_customer(app.state::<AppState>(), customer).expect("add_customer");

    let customers = crate::commands::customers::get_customers(app.state::<AppState>()).expect("get_customers");
    assert_eq!(customers.len(), 1);

    let mut updated = customers[0].clone();
    updated.phone = "779999999".into();
    updated.outstanding_balance = 5000;
    crate::commands::customers::update_customer(app.state::<AppState>(), updated).expect("update_customer");

    let customers = crate::commands::customers::get_customers(app.state::<AppState>()).expect("get_customers");
    assert_eq!(customers.len(), 1);
    assert_eq!(customers[0].phone, "779999999");
    assert_eq!(customers[0].outstanding_balance, 5000);

    crate::commands::customers::delete_customer(app.state::<AppState>(), "c1".into()).expect("delete_customer");
    let customers = crate::commands::customers::get_customers(app.state::<AppState>()).expect("get_customers");
    assert_eq!(customers.len(), 0);
}

#[test]
fn customer_add_rejects_duplicate_id() {
    let app = test_app();
    crate::commands::customers::add_customer(app.state::<AppState>(), make_customer("c1")).expect("first add");

    let dup = make_customer("c1");
    let result = crate::commands::customers::add_customer(app.state::<AppState>(), dup);
    assert!(result.is_err(), "duplicate customer id must be rejected");

    let customers = crate::commands::customers::get_customers(app.state::<AppState>()).expect("get_customers");
    assert_eq!(customers.len(), 1);
}

#[test]
fn customer_delete_missing_is_noop() {
    let app = test_app();
    crate::commands::customers::add_customer(app.state::<AppState>(), make_customer("c1")).expect("add");

    let result = crate::commands::customers::delete_customer(app.state::<AppState>(), "ghost".into());
    assert!(result.is_ok(), "delete of missing id should be a no-op");

    let customers = crate::commands::customers::get_customers(app.state::<AppState>()).expect("get_customers");
    assert_eq!(customers.len(), 1);
}

// ---------------------------------------------------------------------------
// Suppliers CRUD tests
// ---------------------------------------------------------------------------

#[test]
fn supplier_crud_add_get_update_delete() {
    let app = test_app();

    let supplier = make_supplier("s1");
    crate::commands::suppliers::add_supplier(app.state::<AppState>(), supplier).expect("add_supplier");

    let suppliers = crate::commands::suppliers::get_suppliers(app.state::<AppState>()).expect("get_suppliers");
    assert_eq!(suppliers.len(), 1);

    let mut updated = suppliers[0].clone();
    updated.balance = 12000;
    crate::commands::suppliers::update_supplier(app.state::<AppState>(), updated).expect("update_supplier");

    let suppliers = crate::commands::suppliers::get_suppliers(app.state::<AppState>()).expect("get_suppliers");
    assert_eq!(suppliers.len(), 1);
    assert_eq!(suppliers[0].balance, 12000);

    crate::commands::suppliers::delete_supplier(app.state::<AppState>(), "s1".into()).expect("delete_supplier");
    let suppliers = crate::commands::suppliers::get_suppliers(app.state::<AppState>()).expect("get_suppliers");
    assert_eq!(suppliers.len(), 0);
}

#[test]
fn supplier_add_rejects_duplicate_id() {
    let app = test_app();
    crate::commands::suppliers::add_supplier(app.state::<AppState>(), make_supplier("s1")).expect("first add");

    let dup = make_supplier("s1");
    let result = crate::commands::suppliers::add_supplier(app.state::<AppState>(), dup);
    assert!(result.is_err(), "duplicate supplier id must be rejected");

    let suppliers = crate::commands::suppliers::get_suppliers(app.state::<AppState>()).expect("get_suppliers");
    assert_eq!(suppliers.len(), 1);
}

#[test]
fn supplier_delete_missing_is_noop() {
    let app = test_app();
    crate::commands::suppliers::add_supplier(app.state::<AppState>(), make_supplier("s1")).expect("add");

    let result = crate::commands::suppliers::delete_supplier(app.state::<AppState>(), "ghost".into());
    assert!(result.is_ok(), "delete of missing id should be a no-op");

    let suppliers = crate::commands::suppliers::get_suppliers(app.state::<AppState>()).expect("get_suppliers");
    assert_eq!(suppliers.len(), 1);
}
