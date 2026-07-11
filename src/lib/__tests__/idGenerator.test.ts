import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { useIdGenerator } from '@/hooks/useIdGenerator';

// Silence React's "not configured to support act(...)" warning under vitest.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Render the `useIdGenerator` hook in isolation and return the generated
 * function. We avoid @testing-library/react (not installed) by mounting a tiny
 * harness component with react-dom and capturing the returned callback.
 */
function captureGenerator(): (prefix: string) => string {
  let gen: (prefix: string) => string = () => '';
  function Harness() {
    gen = useIdGenerator();
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(Harness));
  });
  act(() => {
    root.unmount();
  });
  container.remove();
  return gen;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('useIdGenerator', () => {
  it('produces 10,000 unique ids for the same prefix (no collisions)', () => {
    const generate = captureGenerator();
    const ids = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      ids.add(generate('prod'));
    }
    expect(ids.size).toBe(10000);
  });

  it('formats ids as `${prefix}-<uuid>`', () => {
    const generate = captureGenerator();
    const id = generate('cust');
    const [prefix, uuid] = id.split('-');
    expect(prefix).toBe('cust');
    const uuidPart = id.slice(prefix.length + 1);
    expect(uuidPart).toMatch(UUID_RE);
    expect(uuidPart.length).toBe(36);
  });

  it('keeps the prefix intact and never leaks it into the uuid', () => {
    const generate = captureGenerator();
    const id = generate('FAC-2026');
    // Format is `${prefix}-${uuid}`; a dash in the prefix is preserved verbatim.
    expect(id.startsWith('FAC-2026-')).toBe(true);
    const uuid = id.slice('FAC-2026-'.length);
    expect(uuid).toMatch(UUID_RE);
    expect(uuid.length).toBe(36);
  });

  it('works with different prefixes without collisions across prefixes', () => {
    const generate = captureGenerator();
    const ids = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      ids.add(generate('prod'));
      ids.add(generate('cust'));
      ids.add(generate('supp'));
      ids.add(generate('mov'));
    }
    expect(ids.size).toBe(20000);
  });

  it('returns a fresh, well-formed id on every call', () => {
    const generate = captureGenerator();
    const a = generate('item');
    const b = generate('item');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^item-[0-9a-f-]{36}$/i);
    expect(b).toMatch(/^item-[0-9a-f-]{36}$/i);
  });
});
