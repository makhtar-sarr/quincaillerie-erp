import { describe, it, expect } from 'vitest';
import { formatNumber, parseSuffix } from './numbering';

describe('formatNumber', () => {
  it('pads the sequence to 3 digits', () => {
    expect(formatNumber('FAC', 2026, 1)).toBe('FAC-2026-001');
    expect(formatNumber('DEV', 2026, 42)).toBe('DEV-2026-042');
    expect(formatNumber('FAC', 2026, 123)).toBe('FAC-2026-123');
  });
});

describe('parseSuffix', () => {
  it('round-trips with formatNumber', () => {
    const num = formatNumber('FAC', 2026, 7);
    expect(parseSuffix(num)).toEqual({ prefix: 'FAC', year: 2026, seq: 7 });
  });

  it('parses multi-character prefixes', () => {
    expect(parseSuffix('REC-2026-010')).toEqual({ prefix: 'REC', year: 2026, seq: 10 });
  });

  it('returns null on malformed input', () => {
    expect(parseSuffix('FAC-26-1')).toBeNull();
    expect(parseSuffix('not-a-number')).toBeNull();
    expect(parseSuffix('FAC-2026-07-01')).toBeNull();
  });
});
