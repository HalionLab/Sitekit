import { describe, it, expect } from 'vitest';
import { isValidSlug, slugify } from '@/lib/validation/slug';

describe('isValidSlug', () => {
  it.each<[string, boolean]>([
    ['hello', true],
    ['hello-world', true],
    ['a-b-c-1-2-3', true],
    ['Hello', false],
    ['hello world', false],
    ['-hello', false],
    ['hello-', false],
    ['hello--world', false],
    ['', false],
  ])('returns %j for %j', (input, expected) => {
    expect(isValidSlug(input)).toBe(expected);
  });
});

describe('slugify', () => {
  it.each<[string, string]>([
    ['Hello World', 'hello-world'],
    ['  Trim me  ', 'trim-me'],
    ['Foo  Bar', 'foo-bar'],
    ["Don't & Won't", 'dont-wont'],
    ['multiple---dashes', 'multiple-dashes'],
  ])('slugifies %j to %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  // Intentional behavior: input with no valid characters slugifies to empty string.
  // The admin slug field then either errors (isValidSlug('') === false) or falls
  // back to the title-derived default. This is by design -- silently inventing a
  // slug for unrenderable input would mask the user's mistake.
  it('returns empty string when input has no alphanumeric characters', () => {
    expect(slugify('---')).toBe('');
    expect(slugify('   ')).toBe('');
  });
});
