import {createContext, createElement, useContext, useEffect, useState, type ReactNode} from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeResolved = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ThemeResolved;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPreference(): ThemeResolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyTheme(resolved: ThemeResolved): void {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

function ThemeProvider({children}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolved, setResolved] = useState<ThemeResolved>(() => {
    const m = getStoredMode();
    return m === 'system' ? getSystemPreference() : m;
  });

  /* Apply .dark class whenever resolved changes */
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  /* Listen to system preference changes only in system mode */
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem('theme', newMode);
    setModeState(newMode);
    if (newMode === 'system') {
      setResolved(getSystemPreference());
    } else {
      setResolved(newMode);
    }
  };

  const toggle = () => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    setModeState(next);
    setResolved(next);
  };

  return createElement(ThemeContext.Provider, {value: {mode, resolved, setMode, toggle}}, children);
}

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export {ThemeProvider, useTheme};
