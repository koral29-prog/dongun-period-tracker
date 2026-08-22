import { daysBetween } from '@/domain/localDate';
import { defaultSettings, type UserSettings } from '@/domain/types';

export function assertDatabaseKeyState(key: string | null, databaseExists: boolean) {
  if (!key && databaseExists) throw new Error('database-key-unavailable');
}

export function assertValidDatabaseKey(key: string) {
  if (!/^[0-9a-f]{64}$/i.test(key)) throw new Error('database-key-invalid');
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integerInRange(value: unknown, minimum: number, maximum: number, fallback: number) {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum ? Number(value) : fallback;
}

export function parseSymptomsJson(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function parseSettingsJson(value: string | null | undefined): UserSettings {
  if (!value) return defaultSettings;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return defaultSettings;
    const reminders = isRecord(parsed.reminders) ? parsed.reminders : {};

    return {
      locale: parsed.locale === 'tr' || parsed.locale === 'en' ? parsed.locale : defaultSettings.locale,
      theme: parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : defaultSettings.theme,
      enabledTrackers: Array.isArray(parsed.enabledTrackers)
        ? parsed.enabledTrackers.filter((item): item is string => typeof item === 'string')
        : defaultSettings.enabledTrackers,
      reminders: {
        enabled: typeof reminders.enabled === 'boolean' ? reminders.enabled : defaultSettings.reminders.enabled,
        hour: integerInRange(reminders.hour, 0, 23, defaultSettings.reminders.hour),
        minute: integerInRange(reminders.minute, 0, 59, defaultSettings.reminders.minute),
        periodEstimateDaysBefore: integerInRange(reminders.periodEstimateDaysBefore, 0, 14, defaultSettings.reminders.periodEstimateDaysBefore),
      },
      notificationPrivacy: parsed.notificationPrivacy === 'descriptive' || parsed.notificationPrivacy === 'discreet'
        ? parsed.notificationPrivacy
        : defaultSettings.notificationPrivacy,
      lockEnabled: typeof parsed.lockEnabled === 'boolean' ? parsed.lockEnabled : defaultSettings.lockEnabled,
      lockGraceSeconds: integerInRange(parsed.lockGraceSeconds, 0, 3600, defaultSettings.lockGraceSeconds),
      baselineCycleLength: integerInRange(parsed.baselineCycleLength, 15, 60, defaultSettings.baselineCycleLength),
      baselinePeriodLength: integerInRange(parsed.baselinePeriodLength, 1, 14, defaultSettings.baselinePeriodLength),
      onboardingComplete: typeof parsed.onboardingComplete === 'boolean' ? parsed.onboardingComplete : defaultSettings.onboardingComplete,
    };
  } catch {
    return defaultSettings;
  }
}
