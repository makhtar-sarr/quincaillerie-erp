// Quincaillerie ERP — Tauri command modules.
//
// Each submodule exposes `#[tauri::command]` functions that are registered in
// `lib.rs` via `tauri::generate_handler!`. Keep this list in sync with the
// modules on disk.

pub mod customers;
pub mod invoices;
pub mod items;
pub mod migrate;
pub mod movements;
pub mod numbering;
pub mod quotes;
pub mod restore;
pub mod settings;
pub mod suppliers;

#[cfg(test)]
mod tests;
