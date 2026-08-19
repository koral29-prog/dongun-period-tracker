import { addLocalDays, compareLocalDates, daysBetween } from '@/domain/localDate';
import type { CycleEstimate, Locale, PeriodEvent } from '@/domain/types';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) throw new Error('Median requires at least one value');
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export class PredictionService {
  estimate(events: PeriodEvent[], baselineCycleLength: number, baselinePeriodLength: number, locale: Locale): CycleEstimate | null {
    const completed = events
      .filter((event) => event.startDate && event.endDate)
      .sort((a, b) => compareLocalDates(a.startDate, b.startDate));
    const last = completed.at(-1);
    if (!last) return null;

    const starts = completed.map((event) => event.startDate);
    const intervals = starts.slice(1).map((start, index) => daysBetween(starts[index], start)).filter((length) => length >= 15 && length <= 90).slice(-6);
    const sparse = intervals.length < 2;
    const cycleLength = sparse ? baselineCycleLength : median(intervals);
    const deviations = sparse ? [] : intervals.map((length) => Math.abs(length - cycleLength));
    const variabilityDays = sparse ? 3 : clamp(Math.ceil(median(deviations) * 1.5), 2, 7);
    const periodLengths = completed.map((event) => daysBetween(event.startDate, event.endDate) + 1).filter((length) => length >= 1 && length <= 14).slice(-6);
    const expectedPeriodLength = periodLengths.length ? median(periodLengths) : baselinePeriodLength;
    const centerDate = addLocalDays(last.startDate, cycleLength);

    return {
      centerDate,
      estimatedStartMin: addLocalDays(centerDate, -variabilityDays),
      estimatedStartMax: addLocalDays(centerDate, variabilityDays),
      expectedPeriodLength,
      supportingCycles: intervals.length,
      variabilityDays,
      disclaimer: locale === 'tr'
        ? 'Tahminler değişebilir. Gebelikten korunma veya tıbbi kararlar için kullanma.'
        : 'Estimates can vary. Do not use them for contraception or medical decisions.',
    };
  }
}

export const predictionService = new PredictionService();
