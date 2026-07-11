import { describe, it, expect } from 'vitest';
import { formatNumber, parseSuffix } from '../numbering';

describe('formatNumber (extended)', () => {
  it('pads the sequence to 3 digits for single-digit seq', () => {
    expect(formatNumber('FAC', 2026, 6)).toBe('FAC-2026-006');
  });
});

describe('parseSuffix (extended)', () => {
  it('parses a well-formed document number', () => {
    expect(parseSuffix('FAC-2026-006')).toEqual({ prefix: 'FAC', year: 2026, seq: 6 });
  });

  it('returns null for an unparseable string', () => {
    expect(parseSuffix('bad')).toBeNull();
  });
});

describe('formatNumber (comprehensive)', () => {
  it('builds numbers for different prefixes and years', () => {
    expect(formatNumber('FAC', 2026, 1)).toBe('FAC-2026-001');
    expect(formatNumber('DEV', 2025, 12)).toBe('DEV-2025-012');
    expect(formatNumber('REC', 2030, 999)).toBe('REC-2030-999');
  });

  it('pads the sequence to 3 digits across the range', () => {
    expect(formatNumber('FAC', 2026, 0)).toBe('FAC-2026-000');
    expect(formatNumber('FAC', 2026, 7)).toBe('FAC-2026-007');
    expect(formatNumber('FAC', 2026, 42)).toBe('FAC-2026-042');
    expect(formatNumber('FAC', 2026, 123)).toBe('FAC-2026-123');
  });

  it('handles boundary years', () => {
    expect(formatNumber('FAC', 2000, 1)).toBe('FAC-2000-001');
    expect(formatNumber('FAC', 9999, 1)).toBe('FAC-9999-001');
  });

  it('handles multi-character prefixes', () => {
    expect(formatNumber('QUO', 2026, 5)).toBe('QUO-2026-005');
  });
});

describe('parseSuffix (comprehensive round-trip)', () => {
  it('round-trips formatNumber output for many values', () => {
    const cases: Array<[string, number, number]> = [
      ['FAC', 2026, 1],
      ['DEV', 2025, 42],
      ['REC', 2030, 999],
      ['QUO', 2000, 0],
      ['FAC', 9999, 123],
    ];
    for (const [prefix, year, seq] of cases) {
      const num = formatNumber(prefix, year, seq);
      expect(parseSuffix(num)).toEqual({ prefix, year, seq });
    }
  });

  it('parses sequence values with and without leading zeros', () => {
    expect(parseSuffix('FAC-2026-007')).toEqual({ prefix: 'FAC', year: 2026, seq: 7 });
    expect(parseSuffix('FAC-2026-123')).toEqual({ prefix: 'FAC', year: 2026, seq: 123 });
  });
});

describe('parseSuffix (comprehensive malformed input)', () => {
  const malformed = [
    '',
    'bad',
    'FAC-26-1',
    'FAC-2026',
    'FAC-2026-07-01',
    'fac-2026-001',
    'FAC-2026-ABC',
    'FAC-XXXX-001',
    ' FAC-2026-001',
    'FAC-2026-001 ',
  ];

  it.each(malformed)('returns null for %j', (input) => {
    expect(parseSuffix(input)).toBeNull();
  });
});
