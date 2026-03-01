'use client';

import * as React from 'react';

const STORAGE_KEY = 'bodylog-theme';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

const ThemeProviderContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
} | null>(null);

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    typeof window !== 'undefined' ? getStoredTheme() : defaultTheme
  );
  const [mounted, setMounted] = React.useState(false);
  const [resolvedTheme, setResolvedTheme] = React.useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    const applied =
      theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    setResolvedTheme(applied);
    root.classList.remove('light', 'dark');
    root.classList.add(applied);
  }, [theme, mounted]);

  const setTheme = React.useCallback((value: Theme) => {
    setThemeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  return (
    <ThemeProviderContext.Provider
      value={{ theme, setTheme, resolvedTheme }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
