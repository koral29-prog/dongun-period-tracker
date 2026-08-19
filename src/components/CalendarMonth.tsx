import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addLocalDays, compareLocalDates, formatLocalDate, parseLocalDate } from '@/domain/localDate';
import type { CycleEstimate, LocalDate, Locale, PeriodEvent } from '@/domain/types';
import type { AppPalette } from '@/constants/palette';
import { useTheme } from '@/state/ThemeContext';

const weekdays = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] };

function isWithin(date: string, start: string, end: string) { return compareLocalDates(date, start) >= 0 && compareLocalDates(date, end) <= 0; }

export function CalendarMonth({ year, month, locale, selected, events, estimate, onSelect }: { year: number; month: number; locale: Locale; selected: LocalDate; events: PeriodEvent[]; estimate: CycleEstimate | null; onSelect: (date: LocalDate) => void }) {
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  const leading = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => index < leading || index >= leading + days ? null : index - leading + 1);
  return <View accessibilityLabel={new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))}>
    <View style={styles.weekdays}>{weekdays[locale].map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
    <View style={styles.grid}>{cells.map((day, index) => {
      if (!day) return <View key={`empty-${index}`} style={styles.cell} />;
      const date = formatLocalDate(year, month, day); const period = events.some((event) => isWithin(date, event.startDate, event.endDate)); const estimated = estimate ? isWithin(date, estimate.estimatedStartMin, estimate.estimatedStartMax) : false; const active = date === selected;
      return <View key={date} style={styles.cell}><Pressable accessibilityRole="button" accessibilityLabel={date} accessibilityState={{ selected: active }} onPress={() => onSelect(date)} style={[styles.day, period && styles.period, estimated && styles.estimated, active && styles.active]}><Text style={[styles.dayText, (period || estimated) && styles.coralText]}>{day}</Text>{period || estimated ? <View style={[styles.dot, estimated && styles.dotOutline]} /> : null}</Pressable></View>;
    })}</View>
  </View>;
}

export function monthFromDate(date: LocalDate) { const parsed = parseLocalDate(date); return { year: parsed.year, month: parsed.month }; }
export function shiftMonth(year: number, month: number, amount: number) { const value = new Date(Date.UTC(year, month - 1 + amount, 1)); return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1 }; }
export function rangeEnd(start: LocalDate, length: number) { return addLocalDays(start, length - 1); }

const createStyles = (colors: AppPalette) => StyleSheet.create({ weekdays: { flexDirection: 'row', marginBottom: 8 }, weekday: { width: '14.285%', color: colors.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, day: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent' }, period: { backgroundColor: colors.coralSoft }, estimated: { borderStyle: 'dashed', borderColor: colors.coral }, active: { borderColor: colors.forest, borderStyle: 'solid', backgroundColor: colors.sageSoft }, dayText: { color: colors.ink, fontSize: 14 }, coralText: { color: colors.danger }, dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.coral }, dotOutline: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.coral } });
