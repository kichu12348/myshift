import type { ReactElement } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigation } from '@/navigation/AppNavigation';
import { ThemeProvider, useTheme } from '@/theme';

function AppContent(): ReactElement {
  const { theme } = useTheme();
  const statusBarStyle = theme.mode === 'dark' ? 'light' : 'dark';

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <AppNavigation />
    </>
  );
}

export default function App(): ReactElement {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
