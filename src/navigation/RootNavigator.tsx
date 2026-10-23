import type { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROOT_ROUTES } from '@/constants/routes';
import { ShiftEditorScreen } from '@/screens/ShiftEditor';
import { TemplateEditorScreen } from '@/screens/TemplateEditor';
import { TemplateListScreen } from '@/screens/TemplateList';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROOT_ROUTES.MAIN_TABS} component={TabNavigator} />
      <Stack.Screen
        name={ROOT_ROUTES.SHIFT_EDITOR}
        component={ShiftEditorScreen}
      />
      <Stack.Screen
        name={ROOT_ROUTES.TEMPLATE_LIST}
        component={TemplateListScreen}
      />
      <Stack.Screen
        name={ROOT_ROUTES.TEMPLATE_EDITOR}
        component={TemplateEditorScreen}
      />
    </Stack.Navigator>
  );
}
