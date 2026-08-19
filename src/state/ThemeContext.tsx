import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type AppPalette } from '@/constants/palette';
import { useApp } from '@/state/AppContext';

type ThemeContextValue = { colors: AppPalette; isDark: boolean };
const ThemeContext = createContext<ThemeContextValue>({ colors: lightPalette, isDark: false });

export function ThemeProvider({ children }: PropsWithChildren) {
  const { settings } = useApp();
  const systemScheme = useColorScheme();
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemScheme === 'dark');
  const value = useMemo(() => ({ colors: isDark ? darkPalette : lightPalette, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
