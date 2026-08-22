import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScalePicker } from '@/components/ScalePicker';
import type { AppPalette } from '@/constants/palette';
import { isValidLocalDate, todayLocalDate } from '@/domain/localDate';
import type { DailyLog } from '@/domain/types';
import { copy } from '@/i18n/copy';
import { cycleRepository } from '@/services/CycleRepository';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

function emptyLog(date: string): DailyLog {
  return { date, flow: 0, pain: 0, mood: 2, energy: 2, spotting: false, discharge: null, sexualActivity: null, notes: '', symptoms: [] };
}

export default function LogScreen() {
  const params = useLocalSearchParams<{ date?: string | string[] }>(); const router = useRouter(); const app = useApp(); const t = copy[app.settings.locale];
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const date = isValidLocalDate(requestedDate) ? requestedDate : todayLocalDate();
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  const [log, setLog] = useState<DailyLog>(() => emptyLog(date));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void cycleRepository.getDailyLog(date).then((existing) => { if (active) setLog(existing ?? emptyLog(date)); }).catch(() => {
      if (active) Alert.alert(t.daily, app.settings.locale === 'tr' ? 'Kayıt açılamadı. Lütfen tekrar dene.' : 'The log couldn’t be opened. Please try again.');
    });
    return () => { active = false; };
  }, [app.settings.locale, date, t.daily]);
  const set = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => setLog((current) => ({ ...current, [key]: value }));
  const symptom = (value: string) => set('symptoms', log.symptoms.includes(value) ? log.symptoms.filter((item) => item !== value) : [...log.symptoms, value]);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try { await app.saveLog(log); router.back(); }
    catch { Alert.alert(t.daily, app.settings.locale === 'tr' ? 'Kayıt kaydedilemedi. Lütfen tekrar dene.' : 'The log couldn’t be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  const flow = [t.none, t.light, t.medium, t.heavy, t.veryHeavy]; const standard = [t.none, t.light, t.medium, t.heavy, t.veryHeavy]; const feeling = [t.low, t.light, t.okay, t.good, t.high];
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.handle} /><Text style={styles.title}>{t.daily}</Text><Text style={styles.subtitle}>{date} · {t.optional}</Text>
    <ScalePicker label={t.flow} labels={flow} value={log.flow} onChange={(value) => set('flow', value as DailyLog['flow'])} /><ScalePicker label={t.pain} labels={standard} value={log.pain} onChange={(value) => set('pain', value as DailyLog['pain'])} /><ScalePicker label={t.mood} labels={feeling} value={log.mood} onChange={(value) => set('mood', value as DailyLog['mood'])} /><ScalePicker label={t.energy} labels={feeling} value={log.energy} onChange={(value) => set('energy', value as DailyLog['energy'])} />
    <View style={styles.toggle}><Text style={styles.label}>{t.spotting}</Text><Switch value={log.spotting} onValueChange={(value) => set('spotting', value)} trackColor={{ true: colors.coral }} /></View><Text style={styles.label}>{t.symptoms}</Text><View style={styles.chips}>{[['bloating', t.bloating], ['headache', t.headache], ['cramps', t.cramps]].map(([key, label]) => <Pressable key={key} onPress={() => symptom(key)} style={[styles.chip, log.symptoms.includes(key) && styles.chipActive]}><Text style={[styles.chipText, log.symptoms.includes(key) && styles.chipTextActive]}>{label}</Text></Pressable>)}</View>
    <Text style={[styles.label, { marginTop: 19 }]}>{t.notes}</Text><TextInput accessibilityLabel={t.notes} value={log.notes} onChangeText={(value) => set('notes', value)} multiline placeholderTextColor={colors.muted} style={styles.input} />
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => { void save(); }} style={[styles.primary, saving && styles.disabled]}><Text style={styles.primaryText}>{t.save}</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={() => router.back()} style={styles.cancel}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ root: { flex: 1, backgroundColor: colors.paper }, content: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 44 }, handle: { width: 54, height: 5, alignSelf: 'center', marginBottom: 20, borderRadius: 3, backgroundColor: colors.line }, title: { color: colors.forestDark, fontFamily: 'serif', fontSize: 30, fontWeight: '700' }, subtitle: { marginTop: 6, marginBottom: 2, color: colors.muted, fontSize: 12, lineHeight: 18 }, toggle: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, label: { color: colors.forestDark, fontSize: 15, fontWeight: '700' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 11 }, chip: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 21 }, chipActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft }, chipText: { color: colors.muted, fontSize: 12 }, chipTextActive: { color: colors.forestDark, fontWeight: '700' }, input: { minHeight: 96, marginTop: 10, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 16, color: colors.ink, backgroundColor: colors.paper, textAlignVertical: 'top' }, primary: { minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 19, backgroundColor: colors.primary }, primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' }, cancel: { minHeight: 50, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.forest, fontSize: 13, fontWeight: '700' }, disabled: { opacity: .6 } });
