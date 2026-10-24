import type { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROOT_ROUTES } from '@/constants/routes';
import { OnboardingScreen } from '@/screens/Onboarding';
import { ReminderSettingsScreen } from '@/screens/ReminderSettings';
import { RotationWizardScreen } from '@/screens/RotationWizard';
import { ShiftEditorScreen } from '@/screens/ShiftEditor';
import { TemplateEditorScreen } from '@/screens/TemplateEditor';
import { TemplateListScreen } from '@/screens/TemplateList';
import { selectOnboardingCompleted, useSettingsStore } from '@/store';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): ReactElement {
  const onboardingCompleted = useSettingsStore(selectOnboardingCompleted);

  return (
    <Stack.Navigator
      initialRouteName={onboardingCompleted ? ROOT_ROUTES.MAIN_TABS : ROOT_ROUTES.ONBOARDING}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ROOT_ROUTES.MAIN_TABS} component={TabNavigator} />
      <Stack.Screen name={ROOT_ROUTES.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={ROOT_ROUTES.SHIFT_EDITOR} component={ShiftEditorScreen} />
      <Stack.Screen name={ROOT_ROUTES.TEMPLATE_LIST} component={TemplateListScreen} />
      <Stack.Screen name={ROOT_ROUTES.TEMPLATE_EDITOR} component={TemplateEditorScreen} />
      <Stack.Screen name={ROOT_ROUTES.ROTATION_WIZARD} component={RotationWizardScreen} />
      <Stack.Screen name={ROOT_ROUTES.REMINDER_SETTINGS} component={ReminderSettingsScreen} />
    </Stack.Navigator>
  );
}
