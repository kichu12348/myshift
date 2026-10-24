import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import type { ThemeModeSetting, TimeFormatSetting, WeekStartSetting } from '@/domain';
import { haptics } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';

export function StepAppearance(): ReactElement {
  const styles = useStyles();
  const settings = useSettingsStore(selectSettings);

  const themeMode = settings?.themeMode ?? 'dark';
  const weekStart = settings?.weekStart ?? 1;
  const timeFormat = settings?.timeFormat ?? '24h';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          How should your calendar look?
        </Text>
        <Text variant="caption" tone="muted">
          Myshift is designed for quiet, glare-free readability at night. Choose your appearance
          and regional calendar formats.
        </Text>
      </View>

      <View style={styles.cardList}>
        {/* Theme Mode Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="body" weight="semibold">
              Theme Mode
            </Text>
            <Text variant="caption" tone="muted">
              Dark mode is recommended for night shifts to reduce glare and eye fatigue
            </Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="Dark (Recommended)"
              iconName="moon"
              selected={themeMode === 'dark'}
              onPress={() => void handleUpdateTheme('dark')}
              accessibilityLabel="Dark theme mode"
            />
            <Chip
              label="Light"
              iconName="sun"
              selected={themeMode === 'light'}
              onPress={() => void handleUpdateTheme('light')}
              accessibilityLabel="Light theme mode"
            />
            <Chip
              label="Auto"
              iconName="activity"
              selected={themeMode === 'auto'}
              onPress={() => void handleUpdateTheme('auto')}
              accessibilityLabel="Auto theme mode"
            />
          </View>
        </View>

        {/* Week Starts On Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="body" weight="semibold">
              Week Starts On
            </Text>
            <Text variant="caption" tone="muted">
              First day of the week in month and week calendar views
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

        {/* Time Format Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="body" weight="semibold">
              Time Format
            </Text>
            <Text variant="caption" tone="muted">
              Clock format displayed across shifts and summaries
            </Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="24-hour (19:00)"
              selected={timeFormat === '24h'}
              onPress={() => void handleUpdateTimeFormat('24h')}
              accessibilityLabel="24-hour time format"
            />
            <Chip
              label="12-hour (7:00 PM)"
              selected={timeFormat === '12h'}
              onPress={() => void handleUpdateTimeFormat('12h')}
              accessibilityLabel="12-hour time format"
            />
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
  cardList: {
    gap: theme.spacing.md,
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
}));
