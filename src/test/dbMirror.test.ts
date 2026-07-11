// @vitest-environment node
import { it, expect } from 'vitest';
import { getDb } from './dbMirror';
import { seedDb } from './seed';

it('creates and reads item from SQLite mirror', () => {
  const db = getDb();
  seedDb();
  
  const result = db.prepare('SELECT * FROM items WHERE id = ?').get('prod-test');
  
  expect(result).toBeDefined();
  expect(result.id).toBe('prod-test');
  expect(result.name).toBe('Test Item');
  expect(result.stock_count).toBe(10);
});