// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { applyStockAdjustment } from '@/lib/business/stock';
import { getDb, resetDb } from '@/test/dbMirror';
import { seedDb } from '@/test/seed';
import type { StockMovement } from '@/types';

function movement(
  type: StockMovement['type'],
  quantity: number,
  reason: StockMovement['reason'],
): StockMovement {
  return {
    id: `mov-${type}-${quantity}`,
    itemId: 'prod-test',
    itemName: 'Test Item',
    type,
    quantity,
    reason,
    date: '2026-01-15',
    referenceCode: `REF-${type}-${quantity}`,
    operator: 'Système',
  };
}

function stockOf(db: ReturnType<typeof getDb>): number {
  const row = db
    .prepare('SELECT stock_count FROM items WHERE id = ?')
    .get('prod-test') as { stock_count: number };
  return row.stock_count;
}

function minStockOf(db: ReturnType<typeof getDb>): number {
  const row = db
    .prepare('SELECT min_stock FROM items WHERE id = ?')
    .get('prod-test') as { min_stock: number };
  return row.min_stock;
}

describe('applyStockAdjustment', () => {
  beforeEach(() => {
    resetDb();
    seedDb();
  });

  it('ENTREE increases stock (10 -> 13)', () => {
    const db = getDb();
    applyStockAdjustment(db, movement('ENTREE', 3, 'Achat Fournisseur'));
    expect(stockOf(db)).toBe(13);
  });

  it('SORTIE decreases stock (10 -> 4)', () => {
    const db = getDb();
    applyStockAdjustment(db, movement('SORTIE', 6, 'Vente Client'));
    expect(stockOf(db)).toBe(4);
  });

  it('records a movement row with the correct type and reason', () => {
    const db = getDb();
    applyStockAdjustment(db, movement('ENTREE', 2, 'Ajustement Inventaire'));

    const row = db
      .prepare(
        'SELECT type, reason, quantity, reference_code FROM stock_movements WHERE id = ?',
      )
      .get('mov-ENTREE-2') as {
      type: string;
      reason: string;
      quantity: number;
      reference_code: string;
    };
    expect(row.type).toBe('ENTREE');
    expect(row.reason).toBe('Ajustement Inventaire');
    expect(row.quantity).toBe(2);
    expect(row.reference_code).toBe('REF-ENTREE-2');
  });

  it('respects min_stock as a soft threshold (does not modify it, allows going below)', () => {
    const db = getDb();
    applyStockAdjustment(db, movement('SORTIE', 8, 'Perte / Casse'));

    expect(stockOf(db)).toBe(2);
    expect(minStockOf(db)).toBe(5);
  });

  it('chains ENTREE then SORTIE to net the correct final stock', () => {
    const db = getDb();
    applyStockAdjustment(db, movement('ENTREE', 5, 'Achat Fournisseur'));
    applyStockAdjustment(db, movement('SORTIE', 2, 'Vente Client'));
    expect(stockOf(db)).toBe(13);
  });
});
