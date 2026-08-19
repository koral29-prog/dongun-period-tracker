import type { DailyLog } from '@/domain/types';

function escapeCsv(value: unknown) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(logs: DailyLog[]) {
  const header = ['date', 'flow', 'pain', 'mood', 'energy', 'spotting', 'discharge', 'sexual_activity', 'symptoms', 'notes'];
  const rows = logs.map((log) => [log.date, log.flow, log.pain, log.mood, log.energy, log.spotting, log.discharge, log.sexualActivity, log.symptoms.join('|'), log.notes].map(escapeCsv).join(','));
  return `\uFEFF${header.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}
