import { describe, it, expect } from 'vitest';
import { getReadingTimeMinutes } from '@/lib/content/reading-time';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('getReadingTimeMinutes', () => {
  it('returns 1 for empty input', () => {
    expect(getReadingTimeMinutes('')).toBe(1);
  });

  it('returns 1 for whitespace-only input', () => {
    expect(getReadingTimeMinutes('   \n\t  ')).toBe(1);
  });

  it('returns 1 for very short input (< 200 words)', () => {
    expect(getReadingTimeMinutes(words(50))).toBe(1);
  });

  it('returns 1 at exactly 200 words', () => {
    expect(getReadingTimeMinutes(words(200))).toBe(1);
  });

  it('rounds to the nearest minute for several hundred words', () => {
    // 600 words / 200 wpm = 3 minutes
    expect(getReadingTimeMinutes(words(600))).toBe(3);
  });

  it('does not count markdown syntax tokens as words', () => {
    // 200 real words = 1 min. If the 100 `##` tokens were counted, 300/200
    // would round up to 2. Stripping them keeps it at 1.
    const syntax = Array.from({ length: 100 }, () => '##').join(' ');
    expect(getReadingTimeMinutes(`## ${words(200)}\n\n${syntax}`)).toBe(1);
  });
});
