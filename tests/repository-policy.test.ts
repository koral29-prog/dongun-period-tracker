import { describe, expect, it } from 'vitest';
import { assertDatabaseKeyState, assertSupportedDatabaseVersion, groupPeriodDates } from '@/services/repositoryPolicy';

describe('encrypted repository policy', () => {
  it('blocks silent key regeneration when an encrypted database already exists', () => {
    expect(() => assertDatabaseKeyState(null, true)).toThrow('database-key-unavailable');
    expect(() => assertDatabaseKeyState('device-key', true)).not.toThrow();
    expect(() => assertDatabaseKeyState(null, false)).not.toThrow();
  });

  it('refuses to open a schema created by a newer app', () => {
    expect(() => assertSupportedDatabaseVersion(2, 1)).toThrow('database-version-newer-than-app');
    expect(() => assertSupportedDatabaseVersion(1, 1)).not.toThrow();
  });
});

describe('period event reconstruction', () => {
  it('joins adjacent explicit flow dates and keeps separated dates distinct', () => {
    expect(groupPeriodDates(['2026-08-04', '2026-08-02', '2026-08-03', '2026-08-08'])).toEqual([
      { start: '2026-08-02', end: '2026-08-04' },
      { start: '2026-08-08', end: '2026-08-08' },
    ]);
  });

  it('rebuilds cleanly after a backdated edit removes a flow day', () => {
    expect(groupPeriodDates(['2026-08-02', '2026-08-04'])).toEqual([
      { start: '2026-08-02', end: '2026-08-02' },
      { start: '2026-08-04', end: '2026-08-04' },
    ]);
  });
});
