// Quincaillerie ERP — Tauri commands for store settings operations.

use rusqlite::params;
use rusqlite::OptionalExtension;

use crate::models::StoreSettings;
use crate::state::AppState;

/// Default settings used when the single settings row does not yet exist.
fn default_settings() -> StoreSettings {
    StoreSettings {
        store_name: String::new(),
        address: String::new(),
        phone: String::new(),
        email: String::new(),
        ninea: String::new(),
        rc: String::new(),
        tva_rate: 0,
        currency: "FCFA".to_string(),
    }
}

/// Return the store settings. The settings table holds a single row (id = 1);
/// if it does not exist yet, sensible defaults are returned.
#[tauri::command]
pub fn get_settings(state: tauri::State<'_, AppState>) -> Result<StoreSettings, String> {
    let conn = state.conn()?;

    let result = conn
        .query_row(
            "SELECT store_name, address, phone, email, ninea, rc, tva_rate, currency FROM settings WHERE id = 1",
            [],
            |row| {
                Ok(StoreSettings {
                    store_name: row.get(0)?,
                    address: row.get(1)?,
                    phone: row.get(2)?,
                    email: row.get(3)?,
                    ninea: row.get(4)?,
                    rc: row.get(5)?,
                    tva_rate: row.get(6)?,
                    currency: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result.unwrap_or_else(default_settings))
}

/// Insert or update the store settings (single row, id = 1). Returns the
/// persisted settings.
#[tauri::command]
pub fn update_settings(
    state: tauri::State<'_, AppState>,
    settings: StoreSettings,
) -> Result<StoreSettings, String> {
    let conn = state.conn()?;

    conn.execute(
        "INSERT INTO settings (id, store_name, address, phone, email, ninea, rc, tva_rate, currency)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
           store_name = ?1,
           address = ?2,
           phone = ?3,
           email = ?4,
           ninea = ?5,
           rc = ?6,
           tva_rate = ?7,
           currency = ?8",
        params![
            settings.store_name,
            settings.address,
            settings.phone,
            settings.email,
            settings.ninea,
            settings.rc,
            settings.tva_rate,
            settings.currency,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(settings)
}
