import { describe, it, expect } from 'vitest';
import { openingHours } from '@/lib/seo/site';
import type { DayKey } from '@/lib/config/types';

describe('openingHours', () => {
  it('maps a normal day to an OpeningHoursSpecification', () => {
    const result = openingHours({ mon: '8:00-17:00' } as Record<DayKey, string>);
    expect(result).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '08:00', closes: '17:00' },
    ]);
  });

  it('skips a closed day entirely', () => {
    const result = openingHours({ sun: 'closed' } as Record<DayKey, string>);
    expect(result).toEqual([]);
  });

  it('zero-pads a single-digit hour', () => {
    const result = openingHours({ sat: '9:00-14:00' } as Record<DayKey, string>);
    expect(result).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '14:00' },
    ]);
  });
});
