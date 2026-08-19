import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppPalette } from '@/constants/palette';
import { useTheme } from '@/state/ThemeContext';

export function ScalePicker({ label, labels, value, onChange }: { label: string; labels: string[]; value: number; onChange: (value: number) => void }) {
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.section}><Text style={styles.label}>{label}</Text><View style={styles.row}>{labels.map((text, index) => <Pressable key={`${text}-${index}`} accessibilityRole="button" accessibilityState={{ selected: value === index }} onPress={() => onChange(index)} style={[styles.option, value === index && styles.selected]}><View style={[styles.circle, value === index && styles.circleSelected]} /><Text numberOfLines={2} style={[styles.text, value === index && styles.textSelected]}>{text}</Text></Pressable>)}</View></View>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ section: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, label: { marginBottom: 12, color: colors.forestDark, fontSize: 15, fontWeight: '700' }, row: { flexDirection: 'row', gap: 6 }, option: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 3, paddingVertical: 5, borderWidth: 1, borderColor: 'transparent', borderRadius: 14 }, selected: { borderColor: colors.sage, backgroundColor: colors.sageSoft }, circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.muted }, circleSelected: { borderWidth: 6, borderColor: colors.forest, backgroundColor: colors.paper }, text: { color: colors.muted, fontSize: 10, lineHeight: 12, textAlign: 'center' }, textSelected: { color: colors.forestDark, fontWeight: '700' } });
