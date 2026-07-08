import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/useSettingsStore';
import { ThemePreference } from '@/types/models';

import { buildTheme, Theme } from './theme';

const ThemeContext = createContext<Theme | null>(null);

/**
 * Resolves the active colour scheme from the user's preference (System / Light
 * / Dark) combined with the OS-level appearance, then exposes the derived
 * theme through context.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((s) => s.settings.theme);

  const scheme = resolveScheme(preference, systemScheme ?? 'light');
  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

function resolveScheme(
  preference: ThemePreference,
  system: 'light' | 'dark',
): 'light' | 'dark' {
  if (preference === 'system') return system;
  return preference;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
