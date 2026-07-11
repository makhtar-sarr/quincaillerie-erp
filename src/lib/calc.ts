import { calculateVAT } from '../utils/vat';
import { LineItem } from '../types';

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Pure invoice total computation.
 *
 * Mirrors the inline logic previously in `useLineItems`:
 *   subtotal   = Σ line.total
 *   taxedBase  = max(0, subtotal - discount)
 *   tax        = round(taxedBase * taxRate)   (via calculateVAT)
 *   total      = taxedBase + tax
 *
 * Currency is FCFA (integers, no decimals); tax is rounded to the nearest
 * integer via `calculateVAT`.
 */
export function computeInvoiceTotals(
  lines: LineItem[],
  discount: number,
  taxRate: number,
): InvoiceTotals {
  const subtotal = lines.reduce((acc, line) => acc + line.total, 0);
  const taxedBase = Math.max(0, subtotal - discount);
  const tax = calculateVAT(taxedBase, taxRate);
  const total = taxedBase + tax;
  return { subtotal, tax, total };
}

/**
 * Remaining unpaid amount on an invoice.
 * Never negative (overpayment is treated as fully paid).
 */
export function computeUnpaid(total: number, amountPaid: number): number {
  return Math.max(0, total - amountPaid);
}

/**
 * Apply a debt payment to a customer's outstanding balance.
 * Balance never goes below zero.
 */
export function applyDebtPayment(balance: number, amount: number): number {
  return Math.max(0, balance - amount);
}
