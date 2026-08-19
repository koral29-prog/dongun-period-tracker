import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { AppPalette } from '@/constants/palette';
import { copy } from '@/i18n/copy';
import { privacyLock } from '@/services/PrivacyLock';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

export function PrivacyLockGate({ children }: PropsWithChildren) {
  const { settings } = useApp();
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const t = copy[settings.locale];

  useEffect(() => AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      if (settings.lockEnabled && backgroundedAt.current && Date.now() - backgroundedAt.current >= settings.lockGraceSeconds * 1000) setLocked(true);
      backgroundedAt.current = null;
    } else if (state === 'background') backgroundedAt.current = Date.now();
  }).remove, [settings.lockEnabled, settings.lockGraceSeconds]);

  const unlock = async () => { if (await privacyLock.unlock(settings.locale)) setLocked(false); };
  return <>{children}{locked ? <View style={styles.lock}><Ionicons name="shield-checkmark" size={48} color={colors.forest} /><Text style={styles.title}>{t.private}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={unlock}><Text style={styles.buttonText}>{t.unlock}</Text></Pressable></View> : null}</>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ lock: { ...StyleSheet.absoluteFill, zIndex: 1000, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.cream }, title: { marginVertical: 20, color: colors.forestDark, fontSize: 24, fontWeight: '700', textAlign: 'center' }, button: { minWidth: 200, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.primary }, buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' } });
