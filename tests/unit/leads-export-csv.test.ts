import { describe, it, expect } from 'vitest';
import { escapeCsv } from '@/app/api/admin/leads/export/route';

describe('escapeCsv', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('passes plain values through unchanged', () => {
    expect(escapeCsv('jane@example.com')).toBe('jane@example.com');
  });

  it('quotes values containing a comma, quote, CR, or LF (RFC 4180)', () => {
    expect(escapeCsv('a,b')).toBe('"a,b"');
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsv('a\rb')).toBe('"a\rb"');
  });

  it('prefixes a single quote when the value starts with =, +, -, or @ (formula-injection guard)', () => {
    expect(escapeCsv('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(escapeCsv('+1-555-0100')).toBe("'+1-555-0100");
    expect(escapeCsv('-1+1')).toBe("'-1+1");
    expect(escapeCsv('@mention')).toBe("'@mention");
  });

  it('does not guard a value that merely contains, but does not start with, a trigger character', () => {
    expect(escapeCsv('total=5')).toBe('total=5');
    expect(escapeCsv('a+b')).toBe('a+b');
  });

  it('guards before RFC 4180 quoting so the leading quote is protected like any other char', () => {
    // Starts with '=' AND contains a comma -> guarded, then the whole thing
    // (including the injected leading quote) gets wrapped in double quotes.
    const out = escapeCsv('=1,2');
    expect(out).toBe('"\'=1,2"');
  });
});
