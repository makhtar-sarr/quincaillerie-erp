// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { convertQuoteToInvoice } from '@/lib/business/invoice';
import { getDb, resetDb } from '@/test/dbMirror';
import { seedDb } from '@/test/seed';
import type { LineItem } from '@/types';

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

function insertQuote(db: ReturnType<typeof getDb>): void {
  db.prepare(
    `INSERT INTO quotes
       (id, number, date, expiry_date, customer_id, customer_name,
        subtotal, discount, tax, total, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'quote-test',
    'DEV-2026-001',
    '2026-01-10',
    '2026-02-10',
    'cust-test',
    'Test Customer',
    300,
    0,
    0,
    300,
    'Accepté',
    '',
  );
}

function stockOf(db: ReturnType<typeof getDb>, id: string): number {
  const row = db
    .prepare('SELECT stock_count FROM items WHERE id = ?')
    .get(id) as { stock_count: number };
  return row.stock_count;
}

const quoteInput = {
  id: 'quote-test',
  customerId: 'cust-test',
  customerName: 'Test Customer',
  subtotal: 300,
  discount: 0,
  tax: 0,
  total: 300,
  notes: '',
};

describe('convertQuoteToInvoice', () => {
  beforeEach(() => {
    resetDb();
    seedDb();
    insertExtraItems(getDb());
  });

  it('creates exactly one invoice from the quote', () => {
    const db = getDb();
    insertQuote(db);

    convertQuoteToInvoice(
      db,
      quoteInput,
      [line('prod-test', 1, 100), line('prod-2', 1, 100), line('prod-3', 1, 100)],
      { date: '2026-01-15', number: 'FAC-2026-100' },
    );

    const row = db.prepare('SELECT COUNT(*) AS c FROM invoices').get() as { c: number };
    expect(row.c).toBe(1);
  });

  it('decrements stock exactly once (10 -> 7) for a 3-unit line, not twice', () => {
    const db = getDb();
    insertQuote(db);

    convertQuoteToInvoice(
      db,
      quoteInput,
      [line('prod-test', 3, 100)],
      { date: '2026-01-15', number: 'FAC-2026-100' },
    );

    expect(stockOf(db, 'prod-test')).toBe(7);

    const movements = db
      .prepare("SELECT COUNT(*) AS c FROM stock_movements WHERE type = 'SORTIE'")
      .get() as { c: number };
    expect(movements.c).toBe(1);
  });

  it('applies side effects once across 3 distinct items (3 movements, each stock 10 -> 9)', () => {
    const db = getDb();
    insertQuote(db);

    convertQuoteToInvoice(
      db,
      quoteInput,
      [line('prod-test', 1, 100), line('prod-2', 1, 100), line('prod-3', 1, 100)],
      { date: '2026-01-15', number: 'FAC-2026-100' },
    );

    expect(stockOf(db, 'prod-test')).toBe(9);
    expect(stockOf(db, 'prod-2')).toBe(9);
    expect(stockOf(db, 'prod-3')).toBe(9);

    const movements = db
      .prepare("SELECT COUNT(*) AS c FROM stock_movements WHERE type = 'SORTIE'")
      .get() as { c: number };
    expect(movements.c).toBe(3);
  });

  it('marks the source quote as Converti', () => {
    const db = getDb();
    insertQuote(db);

    convertQuoteToInvoice(
      db,
      quoteInput,
      [line('prod-test', 3, 100)],
      { date: '2026-01-15', number: 'FAC-2026-100' },
    );

    const row = db
      .prepare('SELECT status FROM quotes WHERE id = ?')
      .get('quote-test') as { status: string };
    expect(row.status).toBe('Converti');
  });

  it('links the new invoice to the quote via quote_id', () => {
    const db = getDb();
    insertQuote(db);

    const inv = convertQuoteToInvoice(
      db,
      quoteInput,
      [line('prod-test', 3, 100)],
      { date: '2026-01-15', number: 'FAC-2026-100' },
    );

    expect(inv.quoteId).toBe('quote-test');
    const row = db
      .prepare('SELECT quote_id FROM invoices WHERE id = ?')
      .get(inv.id) as { quote_id: string | null };
    expect(row.quote_id).toBe('quote-test');
  });
});
