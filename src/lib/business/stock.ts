import type { StockMovement } from '@/types';
import type { SqlDb } from './invoice';

/**
 * Apply a stock adjustment: update the item's stock_count and insert a
 * movement record. ENTREE increases stock, SORTIE decreases it.
 */
export function applyStockAdjustment(
  db: SqlDb,
  movement: StockMovement,
): void {
  if (movement.type === 'ENTREE') {
    db.prepare(
      `UPDATE items SET stock_count = stock_count + ? WHERE id = ?`,
    ).run(movement.quantity, movement.itemId);
  } else {
    db.prepare(
      `UPDATE items SET stock_count = stock_count - ? WHERE id = ?`,
    ).run(movement.quantity, movement.itemId);
  }

  db.prepare(
    `INSERT INTO stock_movements
       (id, item_id, item_name, type, quantity, reason, date,
        reference_code, operator)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    movement.id,
    movement.itemId,
    movement.itemName,
    movement.type,
    movement.quantity,
    movement.reason,
    movement.date,
    movement.referenceCode,
    movement.operator,
  );
}

export function getItemMovements(
  db: SqlDb,
  itemId: string,
): StockMovement[] {
  const rows = db.prepare(
    `SELECT id, item_id, item_name, type, quantity, reason, date,
            reference_code, operator
     FROM stock_movements
     WHERE item_id = ?
     ORDER BY date DESC`,
  ).all(itemId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: row.id as string,
    itemId: row.item_id as string,
    itemName: row.item_name as string,
    type: row.type as StockMovement['type'],
    quantity: row.quantity as number,
    reason: row.reason as StockMovement['reason'],
    date: row.date as string,
    referenceCode: row.reference_code as string,
    operator: row.operator as string,
  }));
}

export function getMovementsByReference(
  db: SqlDb,
  referenceCode: string,
): StockMovement[] {
  const rows = db.prepare(
    `SELECT id, item_id, item_name, type, quantity, reason, date,
            reference_code, operator
     FROM stock_movements
     WHERE reference_code = ?
     ORDER BY date DESC`,
  ).all(referenceCode) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: row.id as string,
    itemId: row.item_id as string,
    itemName: row.item_name as string,
    type: row.type as StockMovement['type'],
    quantity: row.quantity as number,
    reason: row.reason as StockMovement['reason'],
    date: row.date as string,
    referenceCode: row.reference_code as string,
    operator: row.operator as string,
  }));
}
