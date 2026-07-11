import { describe, it, expect } from 'vitest';
import { computeInvoiceTotals, computeUnpaid, applyDebtPayment } from './calc';
import { LineItem } from '../types';

const line = (total: number): LineItem => ({
  itemId: 'i',
  itemName: 'n',
  unit: 'u',
  quantity: 1,
  price: total,
  total,
});

describe('computeInvoiceTotals', () => {
  const lines = [line(1000), line(2000), line(500)];

  it('sums line totals and applies the given tax rate', () => {
    // subtotal = 3500, taxedBase = 3500, tax = round(3500*0.18)=630, total = 4130
    const r = computeInvoiceTotals(lines, 0, 0.18);
    expect(r).toEqual({ subtotal: 3500, tax: 630, total: 4130 });
  });

  it('subtracts discount before tax', () => {
    // subtotal = 3500, discount = 500 -> taxedBase = 3000, tax = 540, total = 3540
    const r = computeInvoiceTotals(lines, 500, 0.18);
    expect(r).toEqual({ subtotal: 3500, tax: 540, total: 3540 });
  });

  it('never produces a negative taxed base', () => {
    const r = computeInvoiceTotals(lines, 99999, 0.18);
    expect(r.subtotal).toBe(3500);
    expect(r.tax).toBe(0);
    expect(r.total).toBe(0);
  });

  it('honors a custom tax rate', () => {
    const r = computeInvoiceTotals(lines, 0, 0);
    expect(r.tax).toBe(0);
    expect(r.total).toBe(3500);
  });

  it('handles empty lines', () => {
    const r = computeInvoiceTotals([], 0, 0.18);
    expect(r).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe('computeUnpaid', () => {
  it('returns the remaining balance', () => {
    expect(computeUnpaid(4130, 1000)).toBe(3130);
  });
  it('clamps overpayment to zero', () => {
    expect(computeUnpaid(1000, 1500)).toBe(0);
  });
  it('is zero when fully paid', () => {
    expect(computeUnpaid(1000, 1000)).toBe(0);
  });
});

describe('applyDebtPayment', () => {
  it('reduces the balance', () => {
    expect(applyDebtPayment(5000, 2000)).toBe(3000);
  });
  it('clamps negative balances to zero', () => {
    expect(applyDebtPayment(1000, 1500)).toBe(0);
  });
  it('clears the debt when paid in full', () => {
    expect(applyDebtPayment(1000, 1000)).toBe(0);
  });
});
