import { useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { ROOT_ROUTES } from '@/constants/routes';
import { DEFAULT_APP_SETTINGS, type BackupPayload, type TimeFormatSetting } from '@/domain';
import type { RootStackParamList } from '@/navigation/types';
import { haptics, shareService } from '@/services';
import {
  exportFullBackup,
  restoreDatabaseAndStores,
  selectSettings,
  useSettingsStore,
} from '@/store';
import { makeStyles, type ThemeSetting } from '@/theme';
import { InlineSegmentedControl, type SegmentedOption } from './components/InlineSegmentedControl';
import { RestoreBackupSheet } from './components/RestoreBackupSheet';
import {
  RotationPreviewAccessory,
  TemplatePreviewAccessory,
} from './components/ScheduleRowAccessories';
import { SettingsCard } from './components/SettingsCard';
import { SettingsRow } from './components/SettingsRow';

const THEME_OPTIONS: readonly SegmentedOption<ThemeSetting>[] = [
  { label: 'System', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const TIME_FORMAT_OPTIONS: readonly SegmentedOption<TimeFormatSetting>[] = [
  { label: '12h', value: '12h' },
  { label: '24h', value: '24h' },
];

export function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isConfirmingReset, setIsConfirmingReset] = useState<boolean>(false);
  const [isRestoreVisible, setIsRestoreVisible] = useState<boolean>(false);

  const settings = useSettingsStore(selectSettings);
  const themeMode = settings?.themeMode ?? 'auto';
  const weekStart = settings?.weekStart ?? 1;
  const timeFormat = settings?.timeFormat ?? '24h';

  const handleSelectTheme = async (mode: ThemeSetting): Promise<void> => {
    await useSettingsStore.getState().updateSettings({ themeMode: mode });
  };

  const handleToggleWeekStart = async (val: 'mon' | 'sun'): Promise<void> => {
    haptics.selection();
    const next = val === 'mon' ? 1 : 0;
    await useSettingsStore.getState().updateSettings({ weekStart: next });
  };

  const handleSelectTimeFormat = async (format: TimeFormatSetting): Promise<void> => {
    await useSettingsStore.getState().updateSettings({ timeFormat: format });
  };

  const handleExportBackup = async (): Promise<void> => {
    haptics.selection();
    const json = await exportFullBackup();
    await shareService.shareText({
      title: 'myshift Backup',
      message: json,
    });
  };

  const handleRestoreBackup = async (payload: BackupPayload): Promise<void> => {
    await restoreDatabaseAndStores(payload);
    setIsRestoreVisible(false);
  };

  const handleResetPreferences = async (): Promise<void> => {
    if (!isConfirmingReset) {
      haptics.warning();
      setIsConfirmingReset(true);
      return;
    }
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        {/* PREFERENCES */}
        <SettingsCard title="PREFERENCES">
          <SettingsRow
            icon="moon"
            title="Appearance"
            subtitle="theme"
            rightElement={
              <InlineSegmentedControl
                options={THEME_OPTIONS}
                value={themeMode}
                onChange={(mode) => void handleSelectTheme(mode)}
                accessibilityLabel="Appearance theme"
              />
            }
          />
          <SettingsRow
            icon="calendar"
            title="Start of Week"
            subtitle="First day of the week"
            rightElement={
              <InlineSegmentedControl
                options={[
                  { label: 'Mon', value: 'mon' },
                  { label: 'Sun', value: 'sun' },
                ]}
                value={weekStart === 1 ? 'mon' : 'sun'}
                onChange={(val) => void handleToggleWeekStart(val)}
                accessibilityLabel="Start of week"
                showDivider={false}
                testID="start-of-week-toggle"
              />
            }
            accessibilityLabel="Start of Week"
          />
          <SettingsRow
            icon="clock"
            title="Time Format"
            subtitle="Display time in 12 or 24 hour format"
            rightElement={
              <InlineSegmentedControl
                options={TIME_FORMAT_OPTIONS}
                value={timeFormat}
                onChange={(format) => void handleSelectTimeFormat(format)}
                accessibilityLabel="Time Format"
                showDivider={false}
              />
            }
          />
        </SettingsCard>

        {/* SCHEDULE */}
        <SettingsCard title="SCHEDULE">
          <SettingsRow
            icon="layers"
            title="Shift Templates"
            subtitle="Manage your shift templates"
            rightElement={<TemplatePreviewAccessory />}
            showChevron
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
            }}
            accessibilityLabel="Shift Templates"
          />
          <SettingsRow
            icon="repeat"
            title="Repeating Rotations"
            subtitle="Configure repeating shift cycles"
            rightElement={<RotationPreviewAccessory />}
            showChevron
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD);
            }}
            accessibilityLabel="Repeating Rotations"
          />
          <SettingsRow
            icon="bell"
            title="Shift Reminders"
            subtitle="Set reminders before shifts"
            showChevron
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.REMINDER_SETTINGS);
            }}
            accessibilityLabel="Shift Reminders"
          />
        </SettingsCard>

        {/* DATA */}
        <SettingsCard title="DATA">
          <SettingsRow
            icon="upload-cloud"
            title="Export & Backup"
            subtitle="Export your data or create a backup"
            showChevron
            onPress={() => void handleExportBackup()}
            accessibilityLabel="Export & Backup"
          />
          <SettingsRow
            icon="download-cloud"
            title="Import Shifts"
            subtitle="Import shifts from a file"
            showChevron
            onPress={() => {
              haptics.selection();
              setIsRestoreVisible(true);
            }}
            accessibilityLabel="Import Shifts"
          />
          <SettingsRow
            icon="sliders"
            title="Run Setup Wizard"
            subtitle="Reconfigure templates & preferences"
            showChevron
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.ONBOARDING);
            }}
            accessibilityLabel="Run Setup Wizard"
          />
        </SettingsCard>

        {/* RESET PREFERENCES */}
        <SettingsCard variant="danger">
          <SettingsRow
            icon="rotate-ccw"
            tone="danger"
            title={isConfirmingReset ? 'Tap again to confirm reset' : 'Reset Preferences'}
            subtitle="Restore default app settings"
            showChevron
            onPress={() => void handleResetPreferences()}
            accessibilityLabel={
              isConfirmingReset ? 'Tap again to confirm reset' : 'Reset Preferences'
            }
          />
        </SettingsCard>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text variant="caption" tone="muted" tabularNums>
            myshift · v1.0.0
          </Text>
          <View style={styles.footerRow}>
            <Text variant="caption" tone="muted">
              Made with{' '}
            </Text>
            <Icon name="heart" size={16} tone="danger" />
            <Text variant="caption" tone="muted">
              {' '}
              by Kichu
            </Text>
          </View>
        </View>
      </ScrollView>

      <RestoreBackupSheet
        visible={isRestoreVisible}
        onClose={() => setIsRestoreVisible(false)}
        onRestore={handleRestoreBackup}
      />
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xxl,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
