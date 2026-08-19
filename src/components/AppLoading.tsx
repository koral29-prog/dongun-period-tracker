import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AppPalette } from '@/constants/palette';
import { useTheme } from '@/state/ThemeContext';

export function AppLoading({ error }: { error?: Error | null }) {
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.root}>{error ? <><Text style={styles.title}>Your Cycle couldn’t open its encrypted data</Text><Text style={styles.body}>{error.message}</Text></> : <ActivityIndicator size="large" color={colors.forest} />}</View>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ root: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.cream }, title: { color: colors.forestDark, fontSize: 24, fontWeight: '700' }, body: { marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 22 } });
