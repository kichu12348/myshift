import type { ReactElement } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@/components/Icon';
import { TAB_ROUTES } from '@/constants/routes';
import { CalendarScreen } from '@/screens/Calendar';
import { SettingsScreen } from '@/screens/Settings';
import { StatsScreen } from '@/screens/Stats';
import { useTheme } from '@/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator(): ReactElement {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.size.caption,
          fontWeight: theme.typography.weight.regular,
        },
      }}
    >
      <Tab.Screen
        name={TAB_ROUTES.CALENDAR}
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ focused }: { readonly focused: boolean }) => (
            <Icon name="calendar" size={24} tone={focused ? 'accent' : 'muted'} />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.STATS}
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }: { readonly focused: boolean }) => (
            <Icon name="bar-chart-2" size={24} tone={focused ? 'accent' : 'muted'} />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }: { readonly focused: boolean }) => (
            <Icon name="settings" size={24} tone={focused ? 'accent' : 'muted'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
