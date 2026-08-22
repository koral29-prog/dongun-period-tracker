import { describe, expect, it } from 'vitest';

import { isValidLocalDate, parseLocalDate } from '@/domain/localDate';

describe('local date validation', () => {
  it('accepts real calendar dates including leap day', () => {
    expect(isValidLocalDate('2028-02-29')).toBe(true);
    expect(parseLocalDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('rejects normalized, malformed, and array route values', () => {
    expect(isValidLocalDate('2026-02-30')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-8-1')).toBe(false);
    expect(isValidLocalDate(['2026-08-19'])).toBe(false);
    expect(() => parseLocalDate('2026-02-30')).toThrow('Invalid local date');
  });
});
