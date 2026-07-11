-- Quincaillerie ERP — Initial SQLite schema
-- Migration 001: create all 10 tables.
-- Conventions:
--   * IDs and dates are TEXT (ISO 8601 strings, prefix-uuid IDs)
--   * Money amounts are INTEGER (FCFA, no decimals)
--   * Option<String> fields are nullable; other strings default to ''
--   * All tables use IF NOT EXISTS for idempotent re-runs

-- ---------------------------------------------------------------------------
-- settings (single-row store configuration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id              INTEGER PRIMARY KEY CHECK (id = 1), -- enforce single row
  store_name      TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  ninea           TEXT NOT NULL DEFAULT '',
  rc              TEXT NOT NULL DEFAULT '',
  tva_rate        INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'FCFA'
);

-- ---------------------------------------------------------------------------
-- items (product catalogue + stock)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  ref             TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  unit            TEXT NOT NULL DEFAULT '',
  min_stock       INTEGER NOT NULL DEFAULT 0,
  stock_count     INTEGER NOT NULL DEFAULT 0,
  buying_price    INTEGER NOT NULL DEFAULT 0,
  selling_price   INTEGER NOT NULL DEFAULT 0,
  description     TEXT
);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_ref ON items (ref);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  email             TEXT,
  address           TEXT,
  company           TEXT,
  outstanding_balance INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  email           TEXT,
  address         TEXT,
  balance         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);

-- ---------------------------------------------------------------------------
-- invoices (sales)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT PRIMARY KEY,
  number          TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL DEFAULT '',
  customer_id     TEXT NOT NULL DEFAULT '',
  customer_name   TEXT NOT NULL DEFAULT '',
  subtotal        INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  amount_paid     INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT '',
  notes           TEXT,
  quote_id        TEXT
);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices (date);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices (quote_id);

-- ---------------------------------------------------------------------------
-- invoice_items (line items for each invoice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  TEXT NOT NULL,
  item_id     TEXT NOT NULL DEFAULT '',
  item_name   TEXT NOT NULL DEFAULT '',
  unit        TEXT NOT NULL DEFAULT '',
  quantity    INTEGER NOT NULL DEFAULT 0,
  price       INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_id ON invoice_items (item_id);

-- ---------------------------------------------------------------------------
-- quotes (devis)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
  id              TEXT PRIMARY KEY,
  number          TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL DEFAULT '',
  expiry_date     TEXT NOT NULL DEFAULT '',
  customer_id     TEXT NOT NULL DEFAULT '',
  customer_name   TEXT NOT NULL DEFAULT '',
  subtotal        INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT '',
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes (number);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes (date);

-- ---------------------------------------------------------------------------
-- quote_items (line items for each quote)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id    TEXT NOT NULL,
  item_id     TEXT NOT NULL DEFAULT '',
  item_name   TEXT NOT NULL DEFAULT '',
  unit        TEXT NOT NULL DEFAULT '',
  quantity    INTEGER NOT NULL DEFAULT 0,
  price       INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_item_id ON quote_items (item_id);

-- ---------------------------------------------------------------------------
-- stock_movements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id              TEXT PRIMARY KEY,
  item_id         TEXT NOT NULL DEFAULT '',
  item_name       TEXT NOT NULL DEFAULT '',
  type            TEXT NOT NULL DEFAULT '',
  quantity        INTEGER NOT NULL DEFAULT 0,
  reason          TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL DEFAULT '',
  reference_code  TEXT NOT NULL DEFAULT '',
  operator        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements (item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements (date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (type);

-- ---------------------------------------------------------------------------
-- meta (schema versioning / key-value store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
INSERT INTO meta (key, value) VALUES ('schema_version', '1')
  ON CONFLICT(key) DO NOTHING;
