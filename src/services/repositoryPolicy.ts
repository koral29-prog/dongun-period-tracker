import { daysBetween } from '@/domain/localDate';

export function assertDatabaseKeyState(key: string | null, databaseExists: boolean) {
  if (!key && databaseExists) throw new Error('database-key-unavailable');
}

export function assertSupportedDatabaseVersion(version: number, supportedVersion: number) {
  if (version > supportedVersion) throw new Error('database-version-newer-than-app');
}

export function groupPeriodDates(dates: string[]) {
  const groups: { start: string; end: string }[] = [];
  for (const date of [...new Set(dates)].sort()) {
    const current = groups.at(-1);
    if (current && daysBetween(current.end, date) === 1) current.end = date;
    else groups.push({ start: date, end: date });
  }
  return groups;
}
