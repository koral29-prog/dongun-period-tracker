import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { copy } from '@/i18n/copy';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

export default function TabsLayout() {
  const { settings } = useApp(); const t = copy[settings.locale];
  const { colors } = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.forest, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line, height: 84, paddingTop: 8, paddingBottom: 20 }, tabBarLabelStyle: { fontWeight: '700', fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: t.cycle, tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} /> }} />
    <Tabs.Screen name="history" options={{ title: t.history, tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: t.settings, tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} /> }} />
  </Tabs>;
}
