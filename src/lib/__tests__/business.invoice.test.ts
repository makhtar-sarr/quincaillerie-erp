// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { applyInvoice, reverseInvoice } from '@/lib/business/invoice';
import { getDb, resetDb } from '@/test/dbMirror';
import { seedDb } from '@/test/seed';
import type { Invoice, LineItem } from '@/types';

const line = (itemId: string, qty: number, price: number): LineItem => ({
  itemId,
  itemName: 'Test Item',
  unit: 'Unité',
  quantity: qty,
  price,
  total: qty * price,
});

function insertExtraItems(db: ReturnType<typeof getDb>): void {
  for (const id of ['prod-2', 'prod-3']) {
    db.prepare(
      'INSERT INTO items (id, name, ref, category, unit, min_stock, stock_count, buying_price, selling_price, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, 'Extra', 'EXT', 'Divers', 'Unité', 5, 10, 800, 1000, '');
  }
}

function makeInvoice(items: LineItem[], overrides: Partial<Invoice> = {}): Invoice {
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    id: 'inv-test',
    number: 'FAC-2026-001',
    date: '2026-01-15',
    customerId: 'cust-test',
    customerName: 'Test Customer',
    items,
    subtotal: total,
    discount: 0,
    tax: 0,
    total,
    amountPaid: 0,
    paymentMethod: 'Espèces',
    status: 'Non Payé',
    notes: undefined,
    quoteId: undefined,
    ...overrides,
  };
}

function stockOf(db: ReturnType<typeof getDb>, id: string): number {
  const row = db
    .prepare('SELECT stock_count FROM items WHERE id = ?')
    .get(id) as { stock_count: number };
  return row.stock_count;
}

describe('applyInvoice', () => {
  beforeEach(() => {
    resetDb();
    seedDb();
    insertExtraItems(getDb());
  });

  it('decrements item stock (10 -> 7) for a 3-unit line', () => {
    const db = getDb();
    applyInvoice(db, makeInvoice([line('prod-test', 3, 100)]));

    expect(stockOf(db, 'prod-test')).toBe(7);
  });

  it('creates exactly one SORTIE movement for a single line', () => {
    const db = getDb();
    applyInvoice(db, makeInvoice([line('prod-test', 3, 100)]));

    const rows = db
      .prepare("SELECT type FROM stock_movements WHERE reference_code = ?")
      .all('FAC-2026-001') as Array<{ type: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0].type).toBe('SORTIE');
  });

  it('creates one SORTIE movement per line item (3 total) for 3 distinct items', () => {
    const db = getDb();
    applyInvoice(
      db,
      makeInvoice([line('prod-test', 1, 100), line('prod-2', 1, 100), line('prod-3', 1, 100)]),
    );

    const rows = db
      .prepare("SELECT type FROM stock_movements WHERE reference_code = ?")
      .all('FAC-2026-001') as Array<{ type: string }>;
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.type === 'SORTIE')).toBe(true);
    expect(stockOf(db, 'prod-test')).toBe(9);
    expect(stockOf(db, 'prod-2')).toBe(9);
    expect(stockOf(db, 'prod-3')).toBe(9);
  });

  it('increases customer outstanding balance by (total - amountPaid) (0 -> 300)', () => {
    const db = getDb();
    applyInvoice(db, makeInvoice([line('prod-test', 3, 100)]));

    const row = db
      .prepare('SELECT outstanding_balance FROM customers WHERE id = ?')
      .get('cust-test') as { outstanding_balance: number };
    expect(row.outstanding_balance).toBe(300);
  });

  it('does not change balance when invoice is fully paid', () => {
    const db = getDb();
    applyInvoice(db, makeInvoice([line('prod-test', 3, 100)], { amountPaid: 300, status: 'Payé' }));

    const row = db
      .prepare('SELECT outstanding_balance FROM customers WHERE id = ?')
      .get('cust-test') as { outstanding_balance: number };
    expect(row.outstanding_balance).toBe(0);
  });

  it('inserts the invoice and its line items', () => {
    const db = getDb();
    applyInvoice(db, makeInvoice([line('prod-test', 3, 100)]));

    const inv = db
      .prepare('SELECT id, number, total FROM invoices WHERE id = ?')
      .get('inv-test') as { id: string; number: string; total: number };
    expect(inv.number).toBe('FAC-2026-001');
    expect(inv.total).toBe(300);

    const items = db
      .prepare('SELECT COUNT(*) AS c FROM invoice_items WHERE invoice_id = ?')
      .get('inv-test') as { c: number };
    expect(items.c).toBe(1);
  });
});

describe('reverseInvoice', () => {
  beforeEach(() => {
    resetDb();
    seedDb();
    insertExtraItems(getDb());
  });

  it('restores stock to 10 after reversing', () => {
    const db = getDb();
    const inv = makeInvoice([line('prod-test', 3, 100)]);
    applyInvoice(db, inv);
    reverseInvoice(db, inv);

    expect(stockOf(db, 'prod-test')).toBe(10);
  });

  it('removes the SORTIE movements created by the invoice', () => {
    const db = getDb();
    const inv = makeInvoice([line('prod-test', 3, 100)]);
    applyInvoice(db, inv);
    reverseInvoice(db, inv);

    const rows = db
      .prepare("SELECT COUNT(*) AS c FROM stock_movements WHERE reference_code = ?")
      .get('FAC-2026-001') as { c: number };
    expect(rows.c).toBe(0);
  });

  it('reverts customer balance to 0 after reversing', () => {
    const db = getDb();
    const inv = makeInvoice([line('prod-test', 3, 100)]);
    applyInvoice(db, inv);
    reverseInvoice(db, inv);

    const row = db
      .prepare('SELECT outstanding_balance FROM customers WHERE id = ?')
      .get('cust-test') as { outstanding_balance: number };
    expect(row.outstanding_balance).toBe(0);
  });

  it('deletes the invoice and its line items', () => {
    const db = getDb();
    const inv = makeInvoice([line('prod-test', 3, 100)]);
    applyInvoice(db, inv);
    reverseInvoice(db, inv);

    const invRow = db
      .prepare('SELECT COUNT(*) AS c FROM invoices WHERE id = ?')
      .get('inv-test') as { c: number };
    expect(invRow.c).toBe(0);

    const itemRows = db
      .prepare('SELECT COUNT(*) AS c FROM invoice_items WHERE invoice_id = ?')
      .get('inv-test') as { c: number };
    expect(itemRows.c).toBe(0);
  });
});
