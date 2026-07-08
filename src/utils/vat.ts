export const TAX_RATE = 0.18;

export function calculateVAT(amount: number, rate: number = TAX_RATE): number {
  return Math.round(amount * rate);
}
