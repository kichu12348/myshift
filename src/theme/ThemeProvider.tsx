import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from './theme';

export type ThemeSetting = 'light' | 'dark' | 'auto';

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly mode: ThemeSetting;
  readonly setMode: (mode: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly initialMode?: ThemeSetting;
}

export function ThemeProvider({
  children,
  initialMode = 'auto',
}: ThemeProviderProps): ReactElement {
  const [mode, setMode] = useState<ThemeSetting>(initialMode);
  const systemColorScheme = useColorScheme();

  const theme = useMemo(() => {
    if (mode === 'dark') {
      return darkTheme;
    }
    if (mode === 'light') {
      return lightTheme;
    }
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }, [mode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setMode,
    }),
    [theme, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
