// Quincaillerie ERP — Tauri commands for Customers CRUD operations.

use rusqlite::params;

use crate::models::Customer;
use crate::state::AppState;

/// Return every customer, ordered by name.
#[tauri::command]
pub fn get_customers(state: tauri::State<'_, AppState>) -> Result<Vec<Customer>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, phone, email, address, company, outstanding_balance FROM customers ORDER BY name")
        .map_err(|e| e.to_string())?;

    let customers = stmt
        .query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                company: row.get(5)?,
                outstanding_balance: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Customer>, rusqlite::Error>>()
        .map_err(|e| e.to_string())?;

    Ok(customers)
}

/// Insert a new customer. Rejects duplicates on the `id` column.
#[tauri::command]
pub fn add_customer(
    state: tauri::State<'_, AppState>,
    customer: Customer,
) -> Result<Customer, String> {
    let conn = state.conn()?;

    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM customers WHERE id = ?1",
            params![customer.id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    if exists {
        return Err(format!(
            "Un client avec l'identifiant '{}' existe déjà.",
            customer.id
        ));
    }

    conn.execute(
        "INSERT INTO customers (id, name, phone, email, address, company, outstanding_balance) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            customer.id,
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.company,
            customer.outstanding_balance,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(customer)
}

/// Update an existing customer (matched by id). Returns the updated customer.
#[tauri::command]
pub fn update_customer(
    state: tauri::State<'_, AppState>,
    customer: Customer,
) -> Result<Customer, String> {
    let conn = state.conn()?;

    conn.execute(
        "UPDATE customers SET name = ?1, phone = ?2, email = ?3, address = ?4, company = ?5, outstanding_balance = ?6 WHERE id = ?7",
        params![
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.company,
            customer.outstanding_balance,
            customer.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(customer)
}

/// Delete a customer by id.
#[tauri::command]
pub fn delete_customer(state: tauri::State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;

    conn.execute("DELETE FROM customers WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
