export type ParseResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

export function tryParseJson(input: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON must be a plain object at the top level' };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}
