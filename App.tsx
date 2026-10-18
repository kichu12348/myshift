import type { ReactElement } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StartupStatus } from '@/components/StartupStatus';
import { useDatabaseMigrations } from '@/db';
import { useStoreInitialization, useSyncThemeMode } from '@/hooks';
import { AppNavigation } from '@/navigation/AppNavigation';
import { ThemeProvider, useTheme } from '@/theme';

function InitializedApp(): ReactElement {
  const init = useStoreInitialization();
  useSyncThemeMode();

  if (init.status !== 'ready') {
    return (
      <StartupStatus
        status={init.status}
        {...(init.status === 'error' ? { message: init.message } : {})}
      />
    );
  }

  return <AppNavigation />;
}

function AppContent(): ReactElement {
  const { theme } = useTheme();
  const migration = useDatabaseMigrations();
  const statusBarStyle = theme.mode === 'dark' ? 'light' : 'dark';

  if (migration.status !== 'ready') {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <StartupStatus
          status={migration.status}
          {...(migration.status === 'error'
            ? { message: migration.message }
            : {})}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <InitializedApp />
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
