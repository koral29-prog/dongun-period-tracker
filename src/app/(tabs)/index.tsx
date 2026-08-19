import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarMonth, monthFromDate, shiftMonth } from '@/components/CalendarMonth';
import type { AppPalette } from '@/constants/palette';
import { daysBetween, displayLocalDate, todayLocalDate } from '@/domain/localDate';
import { copy } from '@/i18n/copy';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

export default function CycleScreen() {
  const { settings, events, estimate } = useApp(); const t = copy[settings.locale]; const router = useRouter();
  const { colors, isDark } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const today = todayLocalDate(); const [selected, setSelected] = useState(today); const initial = monthFromDate(today); const [shown, setShown] = useState(initial);
  const latest = events.at(-1); const cycleDay = latest && daysBetween(latest.startDate, today) >= 0 ? daysBetween(latest.startDate, today) + 1 : null;
  const range = estimate ? `${displayLocalDate(estimate.estimatedStartMin, settings.locale)}–${displayLocalDate(estimate.estimatedStartMax, settings.locale, { day: 'numeric' })}` : settings.locale === 'tr' ? 'İlk adet gününü kaydet' : 'Log your first period day';
  const monthLabel = useMemo(() => new Intl.DateTimeFormat(settings.locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(shown.year, shown.month - 1, 1)), [settings.locale, shown]);
  const move = (amount: number) => setShown((current) => shiftMonth(current.year, current.month, amount));
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <LinearGradient colors={isDark ? ['#151C17', '#17231A'] : ['#FFFDF8', '#EDF2E9']} style={[styles.hero, { paddingTop: Math.max(58, insets.top + 18), minHeight: 270 + Math.max(0, insets.top - 40) }]}> 
      <Image source={require('@/assets/app/eucalyptus-branch.png')} style={styles.botanical} accessibilityIgnoresInvertColors />
      <Text style={styles.privacy}><Ionicons name="shield-checkmark" size={13} />  {t.private.toUpperCase()}</Text><Text style={styles.title}>{t.title}</Text>
      <Text style={styles.estimateLabel}>{t.estimated}</Text><Text style={styles.estimateDate}>{range}</Text><Text style={styles.varies}>{t.varies}</Text>
      <View style={styles.ring}><Image source={require('@/assets/app/cycle-ring.png')} style={styles.ringImage} /><View style={styles.ringText}><Text style={styles.ringTitle}>{cycleDay ? t.cycleDay(cycleDay) : '—'}</Text><Text style={styles.ringSub}>~{settings.baselineCycleLength} {t.days}</Text></View></View>
    </LinearGradient>
    <View style={styles.calendarCard}><View style={styles.monthNav}><Pressable onPress={() => move(-1)} style={styles.roundButton}><Ionicons name="chevron-back" size={22} color={colors.forest} /></Pressable><Text style={styles.month}>{monthLabel}</Text><Pressable onPress={() => move(1)} style={styles.roundButton}><Ionicons name="chevron-forward" size={22} color={colors.forest} /></Pressable></View>
      <CalendarMonth year={shown.year} month={shown.month} locale={settings.locale} selected={selected} events={events} estimate={estimate} onSelect={(date) => { setSelected(date); router.push({ pathname: '/log', params: { date } }); }} />
      <View style={styles.legend}><View style={styles.legendItem}><View style={styles.loggedDot} /><Text style={styles.legendText}>{t.logged}</Text></View><View style={styles.legendItem}><View style={styles.estimatedDot} /><Text style={styles.legendText}>{t.estimate}</Text></View></View>
      <Text style={styles.based}>{t.basedOn(estimate?.supportingCycles ?? 0)}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/log', params: { date: selected } })} style={styles.primary}><Ionicons name="water" size={20} color={colors.onPrimary} /><Text style={styles.primaryText}>{t.logToday}</Text></Pressable>
    </View><Text style={styles.disclaimer}>{estimate?.disclaimer ?? t.notMedical}</Text>
  </ScrollView>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ root: { flex: 1, backgroundColor: colors.cream }, content: { paddingBottom: 28 }, hero: { minHeight: 270, overflow: 'hidden', paddingTop: 58, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, botanical: { position: 'absolute', top: -30, right: -55, width: 245, height: 300, opacity: .45, resizeMode: 'contain' }, privacy: { color: colors.moss, fontSize: 10, fontWeight: '700', letterSpacing: .7 }, title: { marginTop: 16, color: colors.forestDark, fontFamily: 'serif', fontSize: 38, fontWeight: '700' }, estimateLabel: { marginTop: 20, color: colors.forest, fontSize: 13 }, estimateDate: { marginTop: 2, maxWidth: 230, color: colors.coral, fontFamily: 'serif', fontSize: 25, fontWeight: '700' }, varies: { marginTop: 4, color: colors.moss, fontSize: 11 }, ring: { position: 'absolute', right: 15, bottom: 16, width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }, ringImage: { position: 'absolute', width: 140, height: 140 }, ringText: { width: 88, minHeight: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderWidth: 1, borderColor: colors.sage, borderRadius: 44, backgroundColor: colors.paper }, ringTitle: { color: colors.forestDark, fontFamily: 'serif', fontSize: 16, fontWeight: '700', textAlign: 'center' }, ringSub: { marginTop: 3, color: colors.moss, fontSize: 10, fontWeight: '600' }, calendarCard: { paddingHorizontal: 18, paddingTop: 18 }, monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, roundButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.sageSoft }, month: { color: colors.forestDark, fontFamily: 'serif', fontSize: 22, fontWeight: '700' }, legend: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 12 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, legendText: { color: colors.muted, fontSize: 11 }, loggedDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.coral, backgroundColor: colors.coralSoft }, estimatedDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.coral }, based: { marginVertical: 13, color: colors.muted, fontSize: 11, textAlign: 'center' }, primary: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, backgroundColor: colors.primary }, primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' }, disclaimer: { marginTop: 14, paddingHorizontal: 26, color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' } });
