use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Item {
  pub id: String,
  pub name: String,
  pub ref_: String, // `ref` is a Rust keyword; maps to TS `ref` (SKU code)
  pub category: String,
  pub unit: String, // e.g., 'Sac', 'Barre', 'Litre', 'Unité', 'Paquet', 'Tonne'
  pub min_stock: i64, // Minimum security stock alert limit
  pub stock_count: i64, // Current physical stock
  pub buying_price: i64, // In FCFA
  pub selling_price: i64, // In FCFA
  pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StockMovement {
  pub id: String,
  pub item_id: String,
  pub item_name: String,
  pub type_: String, // `type` is a Rust keyword; maps to TS `type` ('ENTREE' | 'SORTIE')
  pub quantity: i64,
  pub reason: String, // 'Achat Fournisseur' | 'Vente Client' | 'Ajustement Inventaire' | 'Perte / Casse' | 'Retour Client'
  pub date: String,
  pub reference_code: String,
  pub operator: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
  pub id: String,
  pub name: String,
  pub phone: String,
  pub email: Option<String>,
  pub address: Option<String>,
  pub company: Option<String>,
  pub outstanding_balance: i64, // FCFA
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Supplier {
  pub id: String,
  pub name: String,
  pub phone: String,
  pub email: Option<String>,
  pub address: Option<String>,
  pub balance: i64, // FCFA
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LineItem {
  pub item_id: String,
  pub item_name: String,
  pub unit: String,
  pub quantity: i64,
  pub price: i64, // Selling price per unit
  pub total: i64, // quantity * price
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Quote {
  pub id: String,
  pub number: String, // e.g., DEV-2026-001
  pub date: String,
  pub expiry_date: String,
  pub customer_id: String,
  pub customer_name: String,
  pub items: Vec<LineItem>,
  pub subtotal: i64,
  pub discount: i64, // in FCFA
  pub tax: i64, // standard VAT
  pub total: i64,
  pub status: String, // 'Brouillon' | 'Envoyé' | 'Accepté' | 'Expiré'
  pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
  pub id: String,
  pub number: String, // e.g., FAC-2026-001
  pub date: String,
  pub customer_id: String,
  pub customer_name: String,
  pub items: Vec<LineItem>,
  pub subtotal: i64,
  pub discount: i64, // in FCFA
  pub tax: i64,
  pub total: i64,
  pub amount_paid: i64,
  pub payment_method: String, // 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement'
  pub status: String, // 'Payé' | 'Partiel' | 'Non Payé'
  pub notes: Option<String>,
  pub quote_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StoreSettings {
  pub store_name: String,
  pub address: String,
  pub phone: String,
  pub email: String,
  pub ninea: String, // Numéro d'Identification Nationale des Entreprises et des Associations
  pub rc: String, // Registre du Commerce
  pub tva_rate: i64, // percentage (e.g. 18 for standard Senegal VAT)
  pub currency: String, // 'FCFA'
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RestoreData {
  pub settings: StoreSettings,
  pub items: Vec<Item>,
  pub movements: Vec<StockMovement>,
  pub customers: Vec<Customer>,
  pub suppliers: Vec<Supplier>,
  pub quotes: Vec<Quote>,
  pub invoices: Vec<Invoice>,
}

/// Alias for the one-shot localStorage → SQLite migration payload.
///
/// The shape is identical to `RestoreData` (the 7-key backup: settings, items,
/// movements, customers, suppliers, quotes, invoices). It is kept as a distinct
/// name so the migration command's intent is explicit at the call site.
pub type StoreState = RestoreData;
