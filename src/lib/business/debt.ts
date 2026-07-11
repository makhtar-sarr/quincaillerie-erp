import type { SqlDb } from './invoice';

export function computeOutstandingDebt(
  db: SqlDb,
  customerId: string,
): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(total - amount_paid), 0) AS debt
     FROM invoices
     WHERE customer_id = ? AND status != 'Payé'`,
  ).get(customerId) as Record<string, unknown> | undefined;

  return (row?.debt as number) ?? 0;
}
