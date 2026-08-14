/**
 * Tiny assertion helpers for custom-section `validateCopy` implementations.
 * Mirrors the tone of `lib/config/validate.ts`: throw on first violation with
 * a message that names the offending field.
 */

export function copyFail(ctx: string, message: string): never {
  throw new Error(`copy.custom.${ctx}: ${message}`);
}

export function asRecord(ctx: string, raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    copyFail(ctx, 'must be an object');
  }
  return raw as Record<string, unknown>;
}

export function reqString(ctx: string, obj: Record<string, unknown>, field: string): string {
  const v = obj[field];
  if (typeof v !== 'string' || !v.trim()) copyFail(ctx, `${field} must be a non-empty string`);
  return v;
}

export function optString(ctx: string, obj: Record<string, unknown>, field: string): string | undefined {
  const v = obj[field];
  if (v === undefined) return undefined;
  if (typeof v !== 'string') copyFail(ctx, `${field} must be a string when present`);
  return v;
}

export function reqArray(ctx: string, obj: Record<string, unknown>, field: string): unknown[] {
  const v = obj[field];
  if (!Array.isArray(v) || v.length === 0) copyFail(ctx, `${field} must be a non-empty array`);
  return v;
}

export function reqCta(ctx: string, obj: Record<string, unknown>, field: string): { label: string; href: string } {
  const v = asRecord(`${ctx}.${field}`, obj[field]);
  return {
    label: reqString(`${ctx}.${field}`, v, 'label'),
    href: reqString(`${ctx}.${field}`, v, 'href'),
  };
}
