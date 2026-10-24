import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { ROOT_ROUTES } from '@/constants/routes';
import {
  getYearMonth,
  type BackupPayload,
  type ThemeModeSetting,
  type TimeFormatSetting,
  type WeekStartSetting,
} from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { haptics, shareService } from '@/services';
import {
  exportFullBackup,
  exportMonthlyCsv,
  restoreDatabaseAndStores,
  selectSettings,
  useSettingsStore,
} from '@/store';
import { makeStyles } from '@/theme';
import { RestoreBackupSheet } from './components/RestoreBackupSheet';

export function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = useToday();

  const [restoreSheetVisible, setRestoreSheetVisible] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const settings = useSettingsStore(selectSettings);
  const themeMode = settings?.themeMode ?? 'auto';
  const weekStart = settings?.weekStart ?? 1;
  const timeFormat = settings?.timeFormat ?? '24h';
  const remindersEnabled = settings?.remindersEnabled ?? true;
  const remindersCount = settings?.defaultMinutesBefore.length ?? 0;

  const handleUpdateTheme = async (mode: ThemeModeSetting): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({ themeMode: mode });
  };

  const handleUpdateWeekStart = async (start: WeekStartSetting): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({ weekStart: start });
  };

  const handleUpdateTimeFormat = async (format: TimeFormatSetting): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({ timeFormat: format });
  };

  const reminderSummary = !remindersEnabled
    ? 'Disabled'
    : remindersCount === 1
      ? '1 reminder active'
      : `${remindersCount} reminders active`;

  const handleExportMonthlyCsv = async (): Promise<void> => {
    if (isExporting) {
      return;
    }
    haptics.selection();
    setIsExporting(true);
    try {
      const currentMonth = getYearMonth(today);
      const csv = await exportMonthlyCsv(currentMonth);
      const monthStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`;
      await shareService.shareText({
        title: `Schedule-${monthStr}.csv`,
        message: csv,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFullBackup = async (): Promise<void> => {
    if (isExporting) {
      return;
    }
    haptics.selection();
    setIsExporting(true);
    try {
      const json = await exportFullBackup();
      await shareService.shareText({
        title: 'myshift-backup.json',
        message: json,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = async (payload: BackupPayload): Promise<void> => {
    await restoreDatabaseAndStores(payload);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text variant="title" style={styles.title}>
        Settings
      </Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" weight="semibold" tone="muted">
            APPEARANCE
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="body" weight="semibold">
              Theme Mode
            </Text>
            <Text variant="caption" tone="muted">
              Choose light, dark, or follow device settings
            </Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="Auto"
              selected={themeMode === 'auto'}
              onPress={() => void handleUpdateTheme('auto')}
              accessibilityLabel="Auto theme mode"
            />
            <Chip
              label="Dark"
              selected={themeMode === 'dark'}
              onPress={() => void handleUpdateTheme('dark')}
              accessibilityLabel="Dark theme mode"
            />
            <Chip
              label="Light"
              selected={themeMode === 'light'}
              onPress={() => void handleUpdateTheme('light')}
              accessibilityLabel="Light theme mode"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" weight="semibold" tone="muted">
            CALENDAR PREFERENCES
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.prefGroup}>
            <View style={styles.cardHeader}>
              <Text variant="body" weight="semibold">
                Week Starts On
              </Text>
              <Text variant="caption" tone="muted">
                First day of the week on calendar views
              </Text>
            </View>
            <View style={styles.chipRow}>
              <Chip
                label="Monday"
                selected={weekStart === 1}
                onPress={() => void handleUpdateWeekStart(1)}
                accessibilityLabel="Start week on Monday"
              />
              <Chip
                label="Sunday"
                selected={weekStart === 0}
                onPress={() => void handleUpdateWeekStart(0)}
                accessibilityLabel="Start week on Sunday"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.prefGroup}>
            <View style={styles.cardHeader}>
              <Text variant="body" weight="semibold">
                Time Format
              </Text>
              <Text variant="caption" tone="muted">
                Display shifts in 24-hour or 12-hour clock
              </Text>
            </View>
            <View style={styles.chipRow}>
              <Chip
                label="24-hour"
                selected={timeFormat === '24h'}
                onPress={() => void handleUpdateTimeFormat('24h')}
                accessibilityLabel="24-hour time format"
              />
              <Chip
                label="12-hour"
                selected={timeFormat === '12h'}
                onPress={() => void handleUpdateTimeFormat('12h')}
                accessibilityLabel="12-hour time format"
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" weight="semibold" tone="muted">
            SCHEDULE & REMINDERS
          </Text>
        </View>

        <View style={styles.cardNavigation}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.REMINDER_SETTINGS);
            }}
            accessibilityRole="button"
            accessibilityLabel="Shift Reminders"
          >
            <View style={styles.rowLeft}>
              <Icon name="bell" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Shift Reminders
                </Text>
                <Text variant="caption" tone="muted">
                  {reminderSummary}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD);
            }}
            accessibilityRole="button"
            accessibilityLabel="Shift rotations"
          >
            <View style={styles.rowLeft}>
              <Icon name="repeat" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Shift Rotations
                </Text>
                <Text variant="caption" tone="muted">
                  Repeating schedule patterns
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              haptics.selection();
              navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
            }}
            accessibilityRole="button"
            accessibilityLabel="Shift templates"
          >
            <View style={styles.rowLeft}>
              <Icon name="layers" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Shift Templates
                </Text>
                <Text variant="caption" tone="muted">
                  Reusable shift presets
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" weight="semibold" tone="muted">
            DATA & BACKUP
          </Text>
        </View>

        <View style={styles.cardNavigation}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => void handleExportMonthlyCsv()}
            accessibilityRole="button"
            accessibilityLabel="Export monthly schedule as CSV"
          >
            <View style={styles.rowLeft}>
              <Icon name="file-text" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Export Monthly Schedule
                </Text>
                <Text variant="caption" tone="muted">
                  Share current month shifts as RFC-4180 CSV
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => void handleExportFullBackup()}
            accessibilityRole="button"
            accessibilityLabel="Export full backup as JSON"
          >
            <View style={styles.rowLeft}>
              <Icon name="archive" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Export Full Backup
                </Text>
                <Text variant="caption" tone="muted">
                  Save all shifts, templates, rotations, and settings
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              haptics.selection();
              setRestoreSheetVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Restore schedule from JSON backup"
          >
            <View style={styles.rowLeft}>
              <Icon name="refresh-cw" size={20} tone="muted" />
              <View style={styles.rowLabelGroup}>
                <Text variant="body" weight="semibold">
                  Restore from Backup
                </Text>
                <Text variant="caption" tone="muted">
                  Import data from a JSON backup payload
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} tone="muted" />
          </Pressable>
        </View>
      </ScrollView>

      <RestoreBackupSheet
        visible={restoreSheetVisible}
        onClose={() => setRestoreSheetVisible(false)}
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
  title: {
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardHeader: {
    gap: theme.spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  prefGroup: {
    gap: theme.spacing.sm,
  },
  cardNavigation: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  rowLabelGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },
}));
