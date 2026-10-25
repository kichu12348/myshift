import { useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { ROOT_ROUTES } from '@/constants/routes';
import { DEFAULT_APP_SETTINGS } from '@/domain';
import type { RootStackParamList } from '@/navigation/types';
import { haptics } from '@/services';
import {
  selectRotations,
  selectSettings,
  selectTemplates,
  useRotationStore,
  useSettingsStore,
  useTemplateStore,
} from '@/store';
import { makeStyles, useTheme } from '@/theme';
import type { TimeFormatSetting, WeekStartSetting } from '@/domain/types/settings';
import { SettingsCard } from './components/SettingsCard';
import { SettingsDropdownRow, type SettingsDropdownOption } from './components/SettingsDropdownRow';
import { SettingsRow } from './components/SettingsRow';
import { SettingsSectionHeader } from './components/SettingsSectionHeader';

const WEEK_START_OPTIONS: readonly SettingsDropdownOption<WeekStartSetting>[] = [
  {
    value: 1,
    label: 'Monday',
    description: 'First day: Mon · ISO 8601',
  },
  {
    value: 0,
    label: 'Sunday',
    description: 'First day: Sun · Traditional',
  },
];

const TIME_FORMAT_OPTIONS: readonly SettingsDropdownOption<TimeFormatSetting>[] = [
  {
    value: '24h',
    label: '24-Hour',
    description: '19:00 · Avoids AM/PM confusion',
  },
  {
    value: '12h',
    label: '12-Hour',
    description: '7:00 PM · Standard 12-hour clock',
  },
];

export function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [isConfirmingReset, setIsConfirmingReset] = useState<boolean>(false);

  const settings = useSettingsStore(selectSettings);
  const templates = useTemplateStore(selectTemplates);
  const rotations = useRotationStore(selectRotations);

  const isDark = theme.mode === 'dark';
  const weekStart = settings?.weekStart ?? 1;
  const timeFormat = settings?.timeFormat ?? '24h';
  const remindersEnabled = settings?.remindersEnabled ?? true;
  const defaultMinutesBefore = settings?.defaultMinutesBefore ?? [];

  const activeTemplatesCount = templates.filter((t) => t.archivedAt === null).length;
  const rotationSubtitle = rotations[0]?.name ?? 'Configure repeating shift cycles';
  const formattedReminders = defaultMinutesBefore
    .slice(0, 3)
    .map((m) => {
      if (m < 60) return `${m}m`;
      if (m % 60 === 0) return `${m / 60}h`;
      return `${Math.floor(m / 60)}h ${m % 60}m`;
    })
    .join(', ');
  const reminderSuffix = defaultMinutesBefore.length > 3 ? '... before' : ' before';
  const reminderSubtitle = !remindersEnabled
    ? 'Reminders disabled'
    : defaultMinutesBefore.length > 0
      ? `${formattedReminders}${reminderSuffix}`
      : 'Reminders disabled';

  const handleToggleDarkMode = async (checked: boolean): Promise<void> => {
    const nextMode = checked ? 'dark' : 'light';
    await useSettingsStore.getState().updateSettings({ themeMode: nextMode });
  };

  const handleSelectWeekStart = async (nextWeekStart: WeekStartSetting): Promise<void> => {
    await useSettingsStore.getState().updateSettings({ weekStart: nextWeekStart });
  };

  const handleSelectTimeFormat = async (nextFormat: TimeFormatSetting): Promise<void> => {
    await useSettingsStore.getState().updateSettings({ timeFormat: nextFormat });
  };

  const handleResetPreferences = async (): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings(DEFAULT_APP_SETTINGS);
    setIsConfirmingReset(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="display" weight="semibold">
          Settings
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* PREFERENCES */}
        <SettingsSectionHeader title="Preferences" icon="sliders" />
        <SettingsCard>
          <SettingsRow
            icon="moon"
            iconTone="accent"
            title="Dark Mode"
            subtitle={isDark ? 'Dark theme enabled' : 'Light theme enabled'}
            trailing={
              <Switch
                value={isDark}
                onValueChange={(checked) => {
                  void handleToggleDarkMode(checked);
                }}
                accessibilityLabel="Dark Mode"
              />
            }
          />
          <SettingsDropdownRow
            icon="calendar"
            iconTone="accent"
            title="Start of Week"
            subtitle={weekStart === 1 ? 'Monday' : 'Sunday'}
            options={WEEK_START_OPTIONS}
            selectedValue={weekStart}
            onSelect={(value) => {
              void handleSelectWeekStart(value);
            }}
            accessibilityLabel="Start of Week"
          />
          <SettingsDropdownRow
            icon="clock"
            iconTone="accent"
            title="Time Format"
            subtitle={timeFormat === '24h' ? '24-hour (19:00)' : '12-hour (7:00 PM)'}
            options={TIME_FORMAT_OPTIONS}
            selectedValue={timeFormat}
            onSelect={(value) => {
              void handleSelectTimeFormat(value);
            }}
            accessibilityLabel="Time Format"
          />
        </SettingsCard>

        {/* SCHEDULE & REMINDERS */}
        <SettingsSectionHeader title="Schedule & Reminders" icon="calendar" />
        <SettingsCard>
          <SettingsRow
            icon="layers"
            iconTone="accent"
            title="Shift Templates"
            subtitle={`${activeTemplatesCount} active template${activeTemplatesCount === 1 ? '' : 's'}`}
            trailing={<Icon name="chevron-right" size={20} tone="muted" />}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
            }}
            accessibilityLabel="Shift Templates"
          />
          <SettingsRow
            icon="repeat"
            iconTone="accent"
            title="Repeating Rotations"
            subtitle={rotationSubtitle}
            trailing={<Icon name="chevron-right" size={20} tone="muted" />}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD);
            }}
            accessibilityLabel="Repeating Rotations"
          />
          <SettingsRow
            icon="bell"
            iconTone="accent"
            title="Shift Reminders"
            subtitle={reminderSubtitle}
            trailing={<Icon name="chevron-right" size={20} tone="muted" />}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.REMINDER_SETTINGS);
            }}
            accessibilityLabel="Shift Reminders"
          />
        </SettingsCard>

        {/* DATA & SETUP */}
        <SettingsSectionHeader title="Data & Setup" icon="shield" />
        <SettingsCard variant="outlined">
          <SettingsRow
            icon="refresh-cw"
            iconTone="accent"
            title="Run Setup Wizard"
            subtitle="Reconfigure Templates & Preferencess"
            trailing={<Icon name="repeat" size={20} tone="accent" />}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.ONBOARDING);
            }}
            accessibilityLabel="Run Setup Wizard"
          />
        </SettingsCard>

        <SettingsCard variant="danger">
          {isConfirmingReset ? (
            <View style={styles.confirmBox}>
              <View style={styles.confirmHeader}>
                <Icon name="alert-triangle" size={16} tone="danger" />
                <Text variant="bodySmall" weight="semibold" tone="danger">
                  Reset all preferences to defaults?
                </Text>
              </View>
              <View style={styles.confirmActions}>
                <Button
                  label="Reset Preferences"
                  variant="danger"
                  onPress={() => void handleResetPreferences()}
                  accessibilityLabel="Confirm reset preferences"
                />
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setIsConfirmingReset(false)}
                  accessibilityLabel="Cancel reset preferences"
                />
              </View>
            </View>
          ) : (
            <SettingsRow
              icon="rotate-ccw"
              iconTone="danger"
              tone="danger"
              title="Reset Preferences"
              subtitle="Restore default app settings"
              trailing={<Icon name="chevron-right" size={20} tone="danger" />}
              onPress={() => setIsConfirmingReset(true)}
              accessibilityLabel="Reset Preferences"
            />
          )}
        </SettingsCard>

        {/* ABOUT */}
        <SettingsSectionHeader title="About" icon="info" />
        <SettingsCard>
          <SettingsRow
            icon="calendar"
            iconTone="accent"
            title="myshift"
            subtitle="shift-work calendar & reminders"
          />
          <SettingsRow icon="info" iconTone="accent" title="Version" subtitle="1.0.0" />
        </SettingsCard>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text variant="bodySmall" tone="muted">
            Made Wid{' '}
          </Text>
          <Icon name="heart" size={16} tone="danger" />
          <Text variant="bodySmall" tone="muted">
            {' '}
            by Kichu
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default SettingsScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xs,
  },
  confirmBox: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
}));
