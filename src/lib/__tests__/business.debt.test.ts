// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { computeOutstandingDebt } from '@/lib/business/debt';
import { getDb, resetDb } from '@/test/dbMirror';
import { seedDb } from '@/test/seed';

type Status = 'Payé' | 'Partiel' | 'Non Payé';

function insertInvoice(
  db: ReturnType<typeof getDb>,
  id: string,
  total: number,
  amountPaid: number,
  status: Status,
): void {
  db.prepare(
    `INSERT INTO invoices
       (id, number, date, customer_id, customer_name, subtotal, discount,
        tax, total, amount_paid, payment_method, status, notes, quote_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    `FAC-2026-${id}`,
    '2026-01-15',
    'cust-test',
    'Test Customer',
    total,
    0,
    0,
    total,
    amountPaid,
    'Espèces',
    status,
    null,
    null,
  );
}

describe('computeOutstandingDebt', () => {
  beforeEach(() => {
    resetDb();
    seedDb();
  });

  it('is zero when the customer has no invoices', () => {
    const db = getDb();
    expect(computeOutstandingDebt(db, 'cust-test')).toBe(0);
  });

  it('sums (total - amount_paid) across unpaid and partial invoices only', () => {
    const db = getDb();
    insertInvoice(db, 'a', 1000, 1000, 'Payé');
    insertInvoice(db, 'b', 500, 200, 'Partiel');
    insertInvoice(db, 'c', 800, 0, 'Non Payé');

    expect(computeOutstandingDebt(db, 'cust-test')).toBe(1100);
  });

  it('excludes fully paid invoices from the debt', () => {
    const db = getDb();
    insertInvoice(db, 'a', 1000, 1000, 'Payé');
    insertInvoice(db, 'b', 250, 250, 'Payé');

    expect(computeOutstandingDebt(db, 'cust-test')).toBe(0);
  });

  it('returns the full total for an unpaid invoice with no payment', () => {
    const db = getDb();
    insertInvoice(db, 'a', 1500, 0, 'Non Payé');
    expect(computeOutstandingDebt(db, 'cust-test')).toBe(1500);
  });

  it('ignores invoices belonging to a different customer', () => {
    const db = getDb();
    insertInvoice(db, 'a', 500, 0, 'Non Payé');
    insertInvoice(db, 'other', 9999, 0, 'Non Payé');

    // 'other' belongs to cust-test too in this seed; scope by inserting for another id.
    db.prepare("UPDATE invoices SET customer_id = 'cust-other' WHERE id = 'other'").run();

    expect(computeOutstandingDebt(db, 'cust-test')).toBe(500);
  });
});
