import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppPalette } from '@/constants/palette';
import type { Locale } from '@/domain/types';
import { useTheme } from '@/state/ThemeContext';

type Props = {
  error?: Error | null;
  locale: Locale;
  onRetry: () => Promise<void>;
  onReset: () => Promise<void>;
};

const recoveryCopy = {
  en: {
    title: 'Your Cycle couldn’t open its encrypted data',
    body: 'Update recovery is available. Try opening your data again first.',
    retry: 'Try again',
    reset: 'Reset local data',
    resetTitle: 'Delete encrypted data?',
    resetBody: 'Only use this if retrying does not work. This permanently removes all cycle records, settings, reminders, and temporary exports from this device.',
    cancel: 'Cancel',
    confirm: 'Delete and start fresh',
    privacy: 'No data will leave this device.',
  },
  tr: {
    title: 'Döngün şifreli verilerini açamadı',
    body: 'Güncelleme kurtarması hazır. Önce verilerini yeniden açmayı dene.',
    retry: 'Tekrar dene',
    reset: 'Yerel verileri sıfırla',
    resetTitle: 'Şifreli veriler silinsin mi?',
    resetBody: 'Bunu yalnızca tekrar denemek işe yaramazsa kullan. Tüm döngü kayıtları, ayarlar, hatırlatmalar ve geçici dışa aktarımlar bu cihazdan kalıcı olarak silinir.',
    cancel: 'Vazgeç',
    confirm: 'Sil ve yeniden başla',
    privacy: 'Hiçbir veri bu cihazdan çıkmaz.',
  },
} as const;

export function AppLoading({ error, locale, onRetry, onReset }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [working, setWorking] = useState(false);
  const text = recoveryCopy[locale];

  const run = async (action: () => Promise<void>) => {
    if (working) return;
    setWorking(true);
    try { await action(); } finally { setWorking(false); }
  };

  const confirmReset = () => Alert.alert(text.resetTitle, text.resetBody, [
    { text: text.cancel, style: 'cancel' },
    { text: text.confirm, style: 'destructive', onPress: () => { void run(onReset); } },
  ]);

  return <SafeAreaView style={styles.root}>
    {error ? <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.lockMark}><Text style={styles.lockGlyph}>●</Text></View>
      <Text style={styles.title}>{text.title}</Text>
      <Text style={styles.body}>{text.body}</Text>
      <Pressable accessibilityRole="button" disabled={working} onPress={() => { void run(onRetry); }} style={({ pressed }) => [styles.primary, pressed && styles.pressed, working && styles.disabled]}>
        {working ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>{text.retry}</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" disabled={working} onPress={confirmReset} style={({ pressed }) => [styles.secondary, pressed && styles.pressed, working && styles.disabled]}>
        <Text style={styles.secondaryText}>{text.reset}</Text>
      </Pressable>
      <Text style={styles.privacy}>{text.privacy}</Text>
    </View> : <ActivityIndicator size="large" color={colors.forest} />}
  </SafeAreaView>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.cream },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', padding: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, borderRadius: 24, backgroundColor: colors.paper },
  lockMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderRadius: 22, backgroundColor: colors.sageSoft },
  lockGlyph: { color: colors.forest, fontSize: 22 },
  title: { color: colors.forestDark, fontSize: 25, lineHeight: 32, fontWeight: '700' },
  body: { marginTop: 12, color: colors.muted, fontSize: 16, lineHeight: 24 },
  primary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderRadius: 17, backgroundColor: colors.primary },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, borderRadius: 16 },
  secondaryText: { color: colors.coral, fontSize: 15, fontWeight: '700' },
  privacy: { marginTop: 18, color: colors.moss, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.6 },
});
