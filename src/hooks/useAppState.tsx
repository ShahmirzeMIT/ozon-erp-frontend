import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import type { DateRange } from '../types';
import { DemoPreferencesStore } from '../services/DemoPreferencesStore';

interface AppState {
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  storeName: string;
}

const DEFAULT_RANGE: DateRange = {
  start: dayjs('2026-09-24').subtract(29, 'day').format('YYYY-MM-DD'),
  end: dayjs('2026-09-24').format('YYYY-MM-DD'),
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => DemoPreferencesStore.getTheme());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    DemoPreferencesStore.setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      dateRange,
      setDateRange,
      theme,
      toggleTheme,
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileMenuOpen,
      setMobileMenuOpen,
      storeName: 'Ozon Store — "Baku Trade" (RUB)',
    }),
    [dateRange, theme, toggleTheme, sidebarCollapsed, mobileMenuOpen],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState AppStateProvider daxilində istifadə olunmalıdır');
  return ctx;
}
