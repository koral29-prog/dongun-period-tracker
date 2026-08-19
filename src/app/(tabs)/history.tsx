import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { daysBetween, displayLocalDate } from '@/domain/localDate';
import type { AppPalette } from '@/constants/palette';
import { copy } from '@/i18n/copy';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

function average(values: number[], fallback: number) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : fallback; }

export default function HistoryScreen() {
  const { settings, events, logs } = useApp(); const t = copy[settings.locale];
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const intervals = events.slice(1).map((event, index) => daysBetween(events[index].startDate, event.startDate)).slice(-6);
  const periodLengths = events.map((event) => daysBetween(event.startDate, event.endDate) + 1).slice(-6);
  const enough = events.length >= 3 && logs.length >= 6;
  return <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}><Text style={styles.kicker}>{t.recentPattern.toUpperCase()}</Text><Text style={styles.title}>{t.history}</Text>
    <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricLabel}>{t.avgCycle}</Text><Text style={styles.metricValue}>{average(intervals, settings.baselineCycleLength)} <Text style={styles.unit}>{t.days}</Text></Text></View><View style={styles.metric}><Text style={styles.metricLabel}>{t.avgPeriod}</Text><Text style={styles.metricValue}>{average(periodLengths, settings.baselinePeriodLength)} <Text style={styles.unit}>{t.days}</Text></Text></View></View>
    <View style={styles.pattern}><Ionicons name="sparkles" size={24} color={colors.forest} /><Text style={styles.patternText}>{enough ? (settings.locale === 'tr' ? `Son kayıtlarında ${logs.filter((log) => log.pain >= 2).length} gün orta veya daha yüksek ağrı işaretledin. Bu bir tanı değildir.` : `You marked moderate or higher pain on ${logs.filter((log) => log.pain >= 2).length} recent days. This is not a diagnosis.`) : t.insufficient}</Text></View>
    <Text style={styles.sectionTitle}>{t.recentCycles}</Text>{[...events].reverse().map((event) => <View key={event.id} style={styles.row}><View style={styles.icon}><Ionicons name="water" size={17} color={colors.coral} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{displayLocalDate(event.startDate, settings.locale)} – {displayLocalDate(event.endDate, settings.locale)}</Text><Text style={styles.rowDetail}>{daysBetween(event.startDate, event.endDate) + 1} {t.days}</Text></View></View>)}
    {!events.length ? <Text style={styles.empty}>{settings.locale === 'tr' ? 'İlk adet gününü kaydettiğinde geçmişin burada görünecek.' : 'Your history will appear here after you log your first period day.'}</Text> : null}
  </ScrollView>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ root: { flex: 1, backgroundColor: colors.cream }, content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 40 }, kicker: { color: colors.moss, fontSize: 11, fontWeight: '700', letterSpacing: .8 }, title: { marginTop: 7, color: colors.forestDark, fontFamily: 'serif', fontSize: 36, fontWeight: '700' }, metrics: { flexDirection: 'row', gap: 12, marginTop: 25 }, metric: { flex: 1, minHeight: 118, justifyContent: 'space-between', padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 22, backgroundColor: colors.paper }, metricLabel: { color: colors.muted, fontSize: 12 }, metricValue: { color: colors.forest, fontFamily: 'serif', fontSize: 30, fontWeight: '700' }, unit: { fontFamily: 'system', fontSize: 11, fontWeight: '500' }, pattern: { flexDirection: 'row', gap: 13, marginTop: 14, padding: 18, borderRadius: 22, backgroundColor: colors.sageSoft }, patternText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 }, sectionTitle: { marginTop: 28, marginBottom: 10, color: colors.forestDark, fontFamily: 'serif', fontSize: 19, fontWeight: '700' }, row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.coralSoft }, rowCopy: { flex: 1 }, rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' }, rowDetail: { marginTop: 3, color: colors.muted, fontSize: 11 }, empty: { marginTop: 20, color: colors.muted, fontSize: 13, lineHeight: 20 } });
