import type { ReactElement } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TAB_ROUTES } from '@/constants/routes';
import { CalendarScreen } from '@/screens/Calendar';
import { SettingsScreen } from '@/screens/Settings';
import { StatsScreen } from '@/screens/Stats';
import { FloatingTabBar } from './FloatingTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Bottom tab navigator wrapped in the custom FloatingTabBar dock.
 */
export function MainTabs(): ReactElement {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={TAB_ROUTES.CALENDAR}
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.STATS}
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
