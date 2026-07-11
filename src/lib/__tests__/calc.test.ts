import { describe, it, expect } from 'vitest';
import { computeInvoiceTotals, computeUnpaid, applyDebtPayment } from '../calc';
import { LineItem } from '../../types';

const line = (total: number): LineItem => ({
  itemId: 'i',
  itemName: 'n',
  unit: 'u',
  quantity: 1,
  price: total,
  total,
});

describe('computeInvoiceTotals (edge cases)', () => {
  it('computes totals for a single line item', () => {
    // subtotal = 2500, taxedBase = 2500, tax = round(2500*0.18)=450, total = 2950
    const r = computeInvoiceTotals([line(2500)], 0, 0.18);
    expect(r).toEqual({ subtotal: 2500, tax: 450, total: 2950 });
  });

  it('applies a discount on a single line item', () => {
    // subtotal = 2500, discount = 500 -> taxedBase = 2000, tax = 360, total = 2360
    const r = computeInvoiceTotals([line(2500)], 500, 0.18);
    expect(r).toEqual({ subtotal: 2500, tax: 360, total: 2360 });
  });
});

describe('computeUnpaid (edge cases)', () => {
  it('is zero when paid exactly', () => {
    expect(computeUnpaid(1000, 1000)).toBe(0);
  });

  it('clamps overpayment to zero', () => {
    expect(computeUnpaid(1000, 1200)).toBe(0);
  });
});

describe('applyDebtPayment (edge cases)', () => {
  it('reduces the balance by the payment amount', () => {
    expect(applyDebtPayment(500, 200)).toBe(300);
  });

  it('clamps overpayment to zero', () => {
    expect(applyDebtPayment(100, 500)).toBe(0);
  });
});

describe('computeInvoiceTotals (comprehensive edge cases)', () => {
  it('rounds tax to the nearest integer (FCFA has no decimals)', () => {
    // 3333 * 0.18 = 599.94 -> rounds to 600
    const r = computeInvoiceTotals([line(3333)], 0, 0.18);
    expect(r.tax).toBe(600);
    expect(r.total).toBe(3933);
  });

  it('applies discount exactly equal to subtotal (zero taxed base)', () => {
    const r = computeInvoiceTotals([line(1000), line(2000)], 3000, 0.18);
    expect(r.subtotal).toBe(3000);
    expect(r.tax).toBe(0);
    expect(r.total).toBe(0);
  });

  it('treats a negative discount as a surcharge (taxedBase increases)', () => {
    // discount=-500 → taxedBase = max(0, 1000 - (-500)) = 1500
    // tax = round(1500 * 0.18) = 270, total = 1770
    const r = computeInvoiceTotals([line(1000)], -500, 0.18);
    expect(r.subtotal).toBe(1000);
    expect(r.tax).toBe(270);
    expect(r.total).toBe(1770);
  });

  it('handles large FCFA amounts without precision loss', () => {
    const r = computeInvoiceTotals([line(1_000_000), line(2_500_000)], 0, 0.18);
    expect(r.subtotal).toBe(3_500_000);
    expect(r.tax).toBe(630_000);
    expect(r.total).toBe(4_130_000);
  });

  it('supports a zero tax rate', () => {
    const r = computeInvoiceTotals([line(1500), line(1500)], 0, 0);
    expect(r.tax).toBe(0);
    expect(r.total).toBe(3000);
  });
});

describe('computeUnpaid (comprehensive edge cases)', () => {
  it('returns zero for a zero total regardless of payment', () => {
    expect(computeUnpaid(0, 0)).toBe(0);
    expect(computeUnpaid(0, 500)).toBe(0);
  });

  it('returns the full total when nothing has been paid', () => {
    expect(computeUnpaid(4130, 0)).toBe(4130);
  });

  it('clamps overpayment on a zero total to zero', () => {
    expect(computeUnpaid(0, 1000)).toBe(0);
  });

  it('handles exact payment as zero', () => {
    expect(computeUnpaid(2500, 2500)).toBe(0);
  });

  it('handles overpayment as zero (never negative)', () => {
    expect(computeUnpaid(1000, 1001)).toBe(0);
  });
});

describe('applyDebtPayment (comprehensive edge cases)', () => {
  it('returns zero for a zero balance regardless of amount', () => {
    expect(applyDebtPayment(0, 0)).toBe(0);
    expect(applyDebtPayment(0, 500)).toBe(0);
  });

  it('returns the full balance when no payment is applied', () => {
    expect(applyDebtPayment(8000, 0)).toBe(8000);
  });

  it('handles exact payment as zero', () => {
    expect(applyDebtPayment(3000, 3000)).toBe(0);
  });

  it('handles overpayment as zero (never negative)', () => {
    expect(applyDebtPayment(1000, 1001)).toBe(0);
  });

  it('reduces the balance by a partial payment', () => {
    expect(applyDebtPayment(5000, 1999)).toBe(3001);
  });
});
