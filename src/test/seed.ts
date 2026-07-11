// @vitest-environment node
import { getDb } from './dbMirror';

function seedDb() {
  const db = getDb();
  
  // Insert test item
  db.prepare(
    'INSERT INTO items (id, name, ref, category, unit, min_stock, stock_count, buying_price, selling_price, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'prod-test',      // id
    'Test Item',      // name
    'TST-001',        // ref
    'Divers',         // category
    'Unité',          // unit
    5,                // min_stock
    10,               // stock_count
    800,              // buying_price
    1000,             // selling_price
    ''                // description
  );
  
  // Insert test customer
  db.prepare(
    'INSERT INTO customers (id, name, phone, email, address, company, outstanding_balance) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'cust-test',               // id
    'Test Customer',           // name
    '+221 00 000 00 00',       // phone
    '',                        // email
    '',                        // address
    '',                        // company
    0                          // outstanding_balance
  );
  
  // Insert test settings
  db.prepare(
    'INSERT INTO settings (id, store_name, address, phone, email, ninea, rc, tva_rate, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    1,                         // id
    'Test Store',              // store_name
    '',                        // address
    '',                        // phone
    '',                        // email
    '',                        // ninea
    '',                        // rc
    18,                        // tva_rate
    'FCFA'                     // currency
  );
}

export { seedDb };