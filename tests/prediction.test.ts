import { describe, expect, it } from 'vitest';
import { addLocalDays, daysBetween } from '@/domain/localDate';
import type { PeriodEvent } from '@/domain/types';
import { PredictionService } from '@/services/PredictionService';

const service = new PredictionService();
const event = (id: number, startDate: string, length = 5): PeriodEvent => ({ id, startDate, endDate: addLocalDays(startDate, length - 1) });

describe('PredictionService', () => {
  it('uses the onboarding baseline and ±3 days for sparse history', () => {
    const result = service.estimate([event(1, '2026-08-02')], 30, 6, 'en')!;
    expect(result.centerDate).toBe('2026-09-01');
    expect(result.estimatedStartMin).toBe('2026-08-29');
    expect(result.estimatedStartMax).toBe('2026-09-04');
    expect(result.supportingCycles).toBe(0);
  });

  it('uses the median of recent completed start-to-start cycles', () => {
    const result = service.estimate([event(1, '2026-01-01'), event(2, '2026-01-29'), event(3, '2026-02-26')], 30, 5, 'en')!;
    expect(result.centerDate).toBe('2026-03-26');
    expect(result.supportingCycles).toBe(2);
    expect(result.variabilityDays).toBe(2);
  });

  it('widens irregular estimates with median absolute deviation and caps at seven days', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-03-05', '2026-03-26', '2026-04-23'];
    const result = service.estimate(starts.map((start, index) => event(index + 1, start)), 28, 5, 'en')!;
    expect(result.variabilityDays).toBe(6);
    expect(daysBetween(result.estimatedStartMin, result.centerDate)).toBe(6);
  });

  it('uses no more than the latest six intervals', () => {
    const starts = ['2025-12-01', '2025-12-21', '2026-01-18', '2026-02-15', '2026-03-15', '2026-04-12', '2026-05-10', '2026-06-07'];
    const result = service.estimate(starts.map((start, index) => event(index + 1, start)), 28, 5, 'en')!;
    expect(result.supportingCycles).toBe(6);
    expect(result.centerDate).toBe('2026-07-05');
  });

  it('recalculates immediately when a backdated start changes', () => {
    const original = [event(1, '2026-05-01'), event(2, '2026-05-29'), event(3, '2026-06-26')];
    const edited = [event(1, '2026-05-01'), event(2, '2026-05-31'), event(3, '2026-06-26')];
    expect(service.estimate(original, 28, 5, 'en')!.centerDate).toBe('2026-07-24');
    expect(service.estimate(edited, 28, 5, 'en')!.variabilityDays).toBeGreaterThanOrEqual(2);
  });

  it('localizes the safety disclaimer', () => {
    expect(service.estimate([event(1, '2026-08-02')], 28, 5, 'tr')!.disclaimer).toContain('Gebelikten korunma');
  });
});

describe('local calendar arithmetic', () => {
  it('handles leap years', () => expect(addLocalDays('2024-02-28', 1)).toBe('2024-02-29'));
  it('is unaffected by daylight-saving boundaries', () => expect(daysBetween('2026-03-08', '2026-03-09')).toBe(1));
  it('is stable across year boundaries', () => expect(addLocalDays('2026-12-31', 1)).toBe('2027-01-01'));
});
