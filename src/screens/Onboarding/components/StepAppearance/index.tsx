import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { InlineSegmentedControl, type SegmentedOption } from '@/components/InlineSegmentedControl';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import type { ThemeModeSetting, TimeFormatSetting, WeekStartSetting } from '@/domain';
import { selectSettings, useSettingsStore } from '@/store';
import { resolveShiftColor, useTheme, makeStyles } from '@/theme';

const THEME_OPTIONS: readonly SegmentedOption<ThemeModeSetting>[] = [
  { label: 'Dark', value: 'dark', accessibilityLabel: 'Dark theme mode' },
  { label: 'Light', value: 'light', accessibilityLabel: 'Light theme mode' },
  { label: 'Auto', value: 'auto', accessibilityLabel: 'Auto theme mode' },
];

const WEEK_OPTIONS: readonly SegmentedOption<string>[] = [
  { label: 'Monday', value: '1', accessibilityLabel: 'Start week on Monday' },
  { label: 'Sunday', value: '0', accessibilityLabel: 'Start week on Sunday' },
];

const TIME_OPTIONS: readonly SegmentedOption<TimeFormatSetting>[] = [
  { label: '24h', value: '24h', accessibilityLabel: '24-hour time format' },
  { label: '12h', value: '12h', accessibilityLabel: '12-hour time format' },
];

export function StepAppearance(): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();
  const settings = useSettingsStore(selectSettings);

  const themeMode: ThemeModeSetting = settings?.themeMode ?? 'dark';
  const weekStart: WeekStartSetting = settings?.weekStart ?? 1;
  const timeFormat: TimeFormatSetting = settings?.timeFormat ?? '24h';

  const handleUpdateTheme = (newMode: ThemeModeSetting): void => {
    void useSettingsStore.getState().updateSettings({ themeMode: newMode });
  };

  const handleUpdateWeekStart = (newStart: string): void => {
    void useSettingsStore
      .getState()
      .updateSettings({ weekStart: Number(newStart) as WeekStartSetting });
  };

  const handleUpdateTimeFormat = (newFormat: TimeFormatSetting): void => {
    void useSettingsStore.getState().updateSettings({ timeFormat: newFormat });
  };

  const sampleHours = timeFormat === '24h' ? '07:00 – 19:00' : '7:00 AM – 7:00 PM';
  const dayShiftColor = resolveShiftColor('amber', theme.mode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          How should your calendar look?
        </Text>
        <Text variant="caption" tone="muted">
          Myshift is designed for quiet, glare-free readability at night. Choose your appearance and
          regional calendar formats.
        </Text>
      </View>

      <View style={styles.card}>
        {/* Appearance Row */}
        <View style={styles.row}>
          <View style={[styles.badge, styles.badgeAccent]}>
            <Icon name={themeMode === 'light' ? 'sun' : 'moon'} size={20} tone="accent" />
          </View>
          <View style={styles.labelCol}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              Appearance
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Theme mode
            </Text>
          </View>
          <InlineSegmentedControl
            options={THEME_OPTIONS}
            value={themeMode}
            onChange={handleUpdateTheme}
          />
        </View>

        <View style={styles.divider} />

        {/* Start of Week Row */}
        <View style={styles.row}>
          <View style={[styles.badge, styles.badgeSecondary]}>
            <Icon name="calendar" size={20} tone="secondary" />
          </View>
          <View style={styles.labelCol}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              Start of Week
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              First calendar day
            </Text>
          </View>
          <InlineSegmentedControl
            options={WEEK_OPTIONS}
            value={String(weekStart)}
            onChange={handleUpdateWeekStart}
          />
        </View>

        <View style={styles.divider} />

        {/* Time Format Row */}
        <View style={styles.row}>
          <View style={[styles.badge, styles.badgeWarning]}>
            <Icon name="clock" size={20} tone="warning" />
          </View>
          <View style={styles.labelCol}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              Time Format
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Clock display
            </Text>
          </View>
          <InlineSegmentedControl
            options={TIME_OPTIONS}
            value={timeFormat}
            onChange={handleUpdateTimeFormat}
          />
        </View>

        <View style={styles.divider} />

        {/* Live Sample Shift Preview */}
        <View style={styles.previewRow}>
          <Text variant="caption" weight="semibold" tone="muted">
            SAMPLE SHIFT PREVIEW
          </Text>
          <View style={styles.sampleShiftCard}>
            <View style={styles.samplePillWrapper}>
              <ShiftPill name="Day" icon="sun" color={dayShiftColor} />
            </View>
            <View style={styles.sampleTimeBadge}>
              <Icon name="clock" size={12} tone="muted" />
              <Text
                variant="caption"
                weight="semibold"
                tabularNums
                tone="text"
                numberOfLines={1}
              >
                {sampleHours}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
    paddingVertical: theme.spacing.xs,
  },
  badge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  badgeSecondary: {
    backgroundColor: `${theme.colors.secondary}1A`,
  },
  badgeWarning: {
    backgroundColor: `${theme.colors.warning}1A`,
  },
  labelCol: {
    flex: 1,
    minWidth: 0,
    gap: theme.sizes.size1,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  previewRow: {
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  sampleShiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: 'hidden',
    gap: theme.spacing.sm,
  },
  samplePillWrapper: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.sizes.pillPaddingCompact,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    flexShrink: 0,
  },
}));
