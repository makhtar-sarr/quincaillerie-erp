import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isTauri } from '../../lib/storageAdapter';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

beforeEach(() => {
  delete (window as Window).__TAURI_INTERNALS__;
});

afterEach(() => {
  delete (window as Window).__TAURI_INTERNALS__;
});

describe('isTauri', () => {
  it('returns false when __TAURI_INTERNALS__ is absent', () => {
    delete (window as Window).__TAURI_INTERNALS__;
    expect(isTauri()).toBe(false);
  });

  it('returns true when __TAURI_INTERNALS__ is present', () => {
    (window as Window).__TAURI_INTERNALS__ = {};
    expect(isTauri()).toBe(true);
  });

  it('reflects the flag being toggled between calls', () => {
    delete (window as Window).__TAURI_INTERNALS__;
    expect(isTauri()).toBe(false);
    (window as Window).__TAURI_INTERNALS__ = { invoke: () => {} };
    expect(isTauri()).toBe(true);
  });
});
