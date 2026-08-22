import type { LocalDate } from './types';

const DAY_MS = 86_400_000;

export function parseLocalDate(value: LocalDate) {
  if (!isValidLocalDate(value)) throw new Error(`Invalid local date: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function isValidLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return normalized.getUTCFullYear() === year && normalized.getUTCMonth() + 1 === month && normalized.getUTCDate() === day;
}

export function formatLocalDate(year: number, month: number, day: number): LocalDate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayLocalDate(now = new Date()): LocalDate {
  return formatLocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addLocalDays(value: LocalDate, amount: number): LocalDate {
  const { year, month, day } = parseLocalDate(value);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return formatLocalDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function daysBetween(start: LocalDate, end: LocalDate): number {
  const a = parseLocalDate(start);
  const b = parseLocalDate(end);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS);
}

export function compareLocalDates(a: LocalDate, b: LocalDate) {
  return a.localeCompare(b);
}

export function displayLocalDate(value: LocalDate, locale: 'en' | 'tr', options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const { year, month, day } = parseLocalDate(value);
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}
