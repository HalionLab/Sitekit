import { describe, it, expect, beforeEach } from 'vitest';
import { isAdminEmail } from '@/lib/admin/auth';

describe('isAdminEmail', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'bill@example.com, ALICE@example.com';
  });

  it('matches an allowlisted email', () => {
    expect(isAdminEmail('bill@example.com')).toBe(true);
  });

  it('matches case-insensitively in both directions', () => {
    expect(isAdminEmail('BILL@example.com')).toBe(true);
    expect(isAdminEmail('alice@example.com')).toBe(true);
  });

  it('trims surrounding whitespace from the input', () => {
    expect(isAdminEmail('  bill@example.com  ')).toBe(true);
  });

  it('rejects non-admins', () => {
    expect(isAdminEmail('bob@example.com')).toBe(false);
  });

  it('rejects partial matches', () => {
    expect(isAdminEmail('bill@example.com.evil.com')).toBe(false);
    expect(isAdminEmail('bill')).toBe(false);
  });

  it('rejects null/undefined/empty', () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });
});
