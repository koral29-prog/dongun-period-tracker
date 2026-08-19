import { describe, expect, it } from 'vitest';
import { serializeCsv } from '@/services/exportFormat';
import type { DailyLog } from '@/domain/types';

function log(overrides: Partial<DailyLog> = {}): DailyLog {
  return { date: '2026-08-19', flow: 2, pain: 2, mood: 2, energy: 2, spotting: false, discharge: null, sexualActivity: null, symptoms: ['şişkinlik'], notes: '', ...overrides };
}

describe('CSV export', () => {
  it('emits UTF-8 BOM and preserves Turkish characters', () => {
    const csv = serializeCsv([log({ notes: 'Baş ağrısı ve yorgunluk' })]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Baş ağrısı ve yorgunluk');
    expect(csv).toContain('şişkinlik');
  });

  it('quotes commas, newlines, and embedded quotes', () => {
    const csv = serializeCsv([log({ notes: 'first, "quoted"\nsecond' })]);
    expect(csv).toContain('"first, ""quoted""\nsecond"');
  });

  it('uses CRLF row separators for spreadsheet compatibility', () => {
    expect(serializeCsv([log()])).toContain('\r\n2026-08-19');
  });
});
