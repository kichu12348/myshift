import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StartupStatus } from '@/components/StartupStatus';
import { useDatabaseMigrations } from '@/db';
import { useReminderSync, useStoreInitialization, useSyncThemeMode } from '@/hooks';
import { AppNavigation } from '@/navigation/AppNavigation';
import { ThemeProvider, useTheme } from '@/theme';

function MainContent(): ReactElement {
  useReminderSync();
  return <AppNavigation />;
}

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

  return <MainContent />;
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
          {...(migration.status === 'error' ? { message: migration.message } : {})}
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
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
