mod commands;
mod db;
mod models;
mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle()
          .plugin(
            tauri_plugin_log::Builder::default()
              .level(log::LevelFilter::Info)
              .build(),
          )?;
      }

      // Resolve the on-disk database path inside the app's data directory and
      // ensure the directory exists before opening the connection.
      let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Impossible de résoudre le répertoire de données: {}", e))?;
      std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Impossible de créer le répertoire de données: {}", e))?;
      let db_path = data_dir.join("quincaillerie.db");

      app.manage(
        state::AppState::new(&db_path)
          .map_err(|e| format!("Échec d'initialisation de la base de données: {}", e))?,
      );

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // Items
      commands::items::get_items,
      commands::items::add_item,
      commands::items::update_item,
      commands::items::delete_item,
      // Customers
      commands::customers::get_customers,
      commands::customers::add_customer,
      commands::customers::update_customer,
      commands::customers::delete_customer,
      // Suppliers
      commands::suppliers::get_suppliers,
      commands::suppliers::add_supplier,
      commands::suppliers::update_supplier,
      commands::suppliers::delete_supplier,
      // Stock movements
      commands::movements::get_movements,
      commands::movements::add_movement,
      // Quotes
      commands::quotes::get_quotes,
      commands::quotes::get_quote_items,
      commands::quotes::add_quote,
      commands::quotes::update_quote_status,
      commands::quotes::delete_quote,
      // Settings
      commands::settings::get_settings,
      commands::settings::update_settings,
      // Numbering
      commands::numbering::get_next_number,
      // Invoices
      commands::invoices::get_invoices,
      commands::invoices::get_invoice_items,
      commands::invoices::add_invoice,
      commands::invoices::delete_invoice,
      commands::invoices::convert_quote_to_invoice,
      // Restore
      commands::restore::restore_all,
      // Migration
      commands::migrate::migrate_local_storage,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
