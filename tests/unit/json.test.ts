import { describe, it, expect } from 'vitest';
import { tryParseJson } from '@/lib/validation/json';

describe('tryParseJson', () => {
  it('parses valid JSON object', () => {
    expect(tryParseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });
  it('rejects invalid JSON', () => {
    const r = tryParseJson('{bad}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('JSON');
  });
  it('rejects non-object top level (arrays, primitives) for schema overrides', () => {
    expect(tryParseJson('[1,2,3]').ok).toBe(false);
    expect(tryParseJson('42').ok).toBe(false);
    expect(tryParseJson('"hello"').ok).toBe(false);
    expect(tryParseJson('null').ok).toBe(false);
  });
  it('accepts empty object', () => {
    expect(tryParseJson('{}')).toEqual({ ok: true, value: {} });
  });
});
