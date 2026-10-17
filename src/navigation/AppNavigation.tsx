import type { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { createNavigationTheme } from './navigationTheme';
import { RootNavigator } from './RootNavigator';

export function AppNavigation(): ReactElement {
  const { theme } = useTheme();
  const navigationTheme = createNavigationTheme(theme);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
