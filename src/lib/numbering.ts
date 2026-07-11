export interface ParsedNumber {
  prefix: string;
  year: number;
  seq: number;
}

/**
 * Build a document number: `${prefix}-${year}-${seq padded to 3 digits}`.
 * e.g. formatNumber('FAC', 2026, 1) → 'FAC-2026-001'.
 */
export function formatNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
}

/**
 * Parse a document number produced by `formatNumber`.
 * Returns null if the string does not match `PREFIX-YYYY-NNN`.
 */
export function parseSuffix(num: string): ParsedNumber | null {
  const m = /^([A-Z]+)-(\d{4})-(\d+)$/.exec(num);
  if (!m) {
    return null;
  }
  return {
    prefix: m[1],
    year: parseInt(m[2], 10),
    seq: parseInt(m[3], 10),
  };
}
