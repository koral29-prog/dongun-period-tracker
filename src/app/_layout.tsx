import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

import { AppLoading } from '@/components/AppLoading';
import { PrivacyLockGate } from '@/components/PrivacyLockGate';
import { AppProvider, useApp } from '@/state/AppContext';
import { ThemeProvider, useTheme } from '@/state/ThemeContext';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

function Navigator() {
  const { ready, error, settings } = useApp();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!settings.onboardingComplete && !inOnboarding) router.replace('/onboarding');
    if (settings.onboardingComplete && inOnboarding) router.replace('/');
  }, [ready, router, segments, settings?.onboardingComplete]);

  if (!ready || error) return <AppLoading error={error} />;
  return <PrivacyLockGate><StatusBar style={isDark ? "light" : "dark"} /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.cream }, headerTintColor: colors.forestDark, contentStyle: { backgroundColor: colors.cream } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="log" options={{ title: '', presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.72, 1], headerShown: false }} />
    <Stack.Screen name="privacy" options={{ title: settings.locale === 'tr' ? 'Gizlilik politikası' : 'Privacy policy' }} />
  </Stack></PrivacyLockGate>;
}

export default function RootLayout() { return <AppProvider><ThemeProvider><Navigator /></ThemeProvider></AppProvider>; }
