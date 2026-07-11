import type { Invoice, LineItem, Quote } from '@/types';

export interface SqlDb {
  prepare(sql: string): {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  };
}

function insertInvoiceRow(db: SqlDb, inv: Invoice): void {
  db.prepare(
    `INSERT INTO invoices
       (id, number, date, customer_id, customer_name, subtotal, discount,
        tax, total, amount_paid, payment_method, status, notes, quote_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    inv.id,
    inv.number,
    inv.date,
    inv.customerId,
    inv.customerName,
    inv.subtotal,
    inv.discount,
    inv.tax,
    inv.total,
    inv.amountPaid,
    inv.paymentMethod,
    inv.status,
    inv.notes ?? null,
    inv.quoteId ?? null,
  );
}

function insertInvoiceItemRow(
  db: SqlDb,
  invoiceId: string,
  item: LineItem,
): void {
  db.prepare(
    `INSERT INTO invoice_items
       (invoice_id, item_id, item_name, unit, quantity, price, total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    invoiceId,
    item.itemId,
    item.itemName,
    item.unit,
    item.quantity,
    item.price,
    item.total,
  );
}

function decrementItemStock(db: SqlDb, item: LineItem): void {
  db.prepare(
    `UPDATE items SET stock_count = stock_count - ? WHERE id = ?`,
  ).run(item.quantity, item.itemId);
}

function incrementItemStock(db: SqlDb, item: LineItem): void {
  db.prepare(
    `UPDATE items SET stock_count = stock_count + ? WHERE id = ?`,
  ).run(item.quantity, item.itemId);
}

function insertSortieMovement(
  db: SqlDb,
  item: LineItem,
  invoiceNumber: string,
  date: string,
): void {
  const movementId = `mov-${Date.now()}-${item.itemId}`;
  db.prepare(
    `INSERT INTO stock_movements
       (id, item_id, item_name, type, quantity, reason, date,
        reference_code, operator)
     VALUES (?, ?, ?, 'SORTIE', ?, 'Vente Client', ?, ?, 'Système')`,
  ).run(
    movementId,
    item.itemId,
    item.itemName,
    item.quantity,
    date,
    invoiceNumber,
  );
}

function adjustCustomerBalance(
  db: SqlDb,
  customerId: string,
  delta: number,
): void {
  db.prepare(
    `UPDATE customers
     SET outstanding_balance = outstanding_balance + ?
     WHERE id = ?`,
  ).run(delta, customerId);
}

function nextInvoiceNumber(db: SqlDb, date: string): string {
  const year = date.split('-')[0] ?? '';
  const likePattern = `FAC-${year}-%`;
  // SUBSTR is 1-based: "FAC-"(4) + year(4) + "-"(1) + 1 = 10 for 4-digit year
  const substrStart = 4 + year.length + 1 + 1;

  const row = db.prepare(
    `SELECT MAX(CAST(SUBSTR(number, ?) AS INTEGER)) AS max_num
     FROM invoices WHERE number LIKE ?`,
  ).get(substrStart, likePattern);

  const maxNum: number = (row as Record<string, unknown>)?.max_num as number ?? 0;
  const next = maxNum + 1;
  return `FAC-${year}-${String(next).padStart(3, '0')}`;
}

/**
 * Insert an invoice and apply all side effects — matching Rust `insert_invoice_tx`:
 * INSERT invoice, INSERT invoice_items, UPDATE items (stock-), INSERT stock_movements
 * (SORTIE), UPDATE customers (outstanding_balance+).
 */
export function applyInvoice(db: SqlDb, invoice: Invoice): void {
  insertInvoiceRow(db, invoice);

  for (const item of invoice.items) {
    insertInvoiceItemRow(db, invoice.id, item);
    decrementItemStock(db, item);
    insertSortieMovement(db, item, invoice.number, invoice.date);
  }

  const owed = invoice.total - invoice.amountPaid;
  if (owed !== 0) {
    adjustCustomerBalance(db, invoice.customerId, owed);
  }
}

/**
 * Reverse all side effects of an invoice — matching Rust `delete_invoice`:
 * stock+, movements removed, balance-, delete invoice_items, delete invoice.
 */
export function reverseInvoice(db: SqlDb, invoice: Invoice): void {
  for (const item of invoice.items) {
    incrementItemStock(db, item);
  }

  db.prepare(
    `DELETE FROM stock_movements WHERE reference_code = ?`,
  ).run(invoice.number);

  const owed = invoice.total - invoice.amountPaid;
  if (owed !== 0) {
    adjustCustomerBalance(db, invoice.customerId, -owed);
  }

  db.prepare(
    `DELETE FROM invoice_items WHERE invoice_id = ?`,
  ).run(invoice.id);

  db.prepare(
    `DELETE FROM invoices WHERE id = ?`,
  ).run(invoice.id);
}

export type QuoteInput = Pick<
  Quote,
  'id' | 'customerId' | 'customerName' | 'subtotal' | 'discount' | 'tax' | 'total' | 'notes'
>;

/**
 * Convert a quote into a new invoice with all side effects (stock, movements,
 * balance) applied once, and mark the source quote as 'Converti'.
 * Mirrors Rust `convert_quote_to_invoice`.
 */
export function convertQuoteToInvoice(
  db: SqlDb,
  quote: QuoteInput,
  items: LineItem[],
  overrides?: { date?: string; number?: string },
): Invoice {
  const date = overrides?.date ?? new Date().toISOString().split('T')[0];
  const number = overrides?.number ?? nextInvoiceNumber(db, date);

  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    number,
    date,
    customerId: quote.customerId,
    customerName: quote.customerName,
    items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    amountPaid: 0,
    paymentMethod: '' as Invoice['paymentMethod'],
    status: 'Non Payé',
    notes: quote.notes,
    quoteId: quote.id,
  };

  applyInvoice(db, invoice);

  db.prepare(
    `UPDATE quotes SET status = 'Converti' WHERE id = ?`,
  ).run(quote.id);

  return invoice;
}

export function getInvoiceItems(db: SqlDb, invoiceId: string): LineItem[] {
  const rows = db.prepare(
    `SELECT item_id, item_name, unit, quantity, price, total
     FROM invoice_items WHERE invoice_id = ?`,
  ).all(invoiceId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    itemId: row.item_id as string,
    itemName: row.item_name as string,
    unit: row.unit as string,
    quantity: row.quantity as number,
    price: row.price as number,
    total: row.total as number,
  }));
}

export function loadInvoice(
  db: SqlDb,
  invoiceId: string,
): (Invoice & { items: LineItem[] }) | undefined {
  const row = db.prepare(
    `SELECT id, number, date, customer_id, customer_name, subtotal, discount,
            tax, total, amount_paid, payment_method, status, notes, quote_id
     FROM invoices WHERE id = ?`,
  ).get(invoiceId) as Record<string, unknown> | undefined;

  if (!row) return undefined;

  const items = getInvoiceItems(db, invoiceId);

  return {
    id: row.id as string,
    number: row.number as string,
    date: row.date as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items,
    subtotal: row.subtotal as number,
    discount: row.discount as number,
    tax: row.tax as number,
    total: row.total as number,
    amountPaid: row.amount_paid as number,
    paymentMethod: row.payment_method as Invoice['paymentMethod'],
    status: row.status as Invoice['status'],
    notes: (row.notes as string) ?? undefined,
    quoteId: (row.quote_id as string) ?? undefined,
  };
}
