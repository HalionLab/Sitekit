import { describe, it, expect } from 'vitest';
import { isValidEmail } from '@/lib/validation/email';

describe('isValidEmail', () => {
  it.each<[string, boolean]>([
    ['user@example.com', true],
    ['user+tag@example.co.uk', true],
    ['x@y.z', true],
    ['no-at-sign.com', false],
    ['two@@example.com', false],
    ['trailing@.com', false],
    ['space @example.com', false],
    ['', false],
    ['  user@example.com  ', false],
  ])('returns %j for %j', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});
