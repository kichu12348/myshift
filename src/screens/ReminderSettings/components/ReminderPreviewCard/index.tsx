import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatMinutesToTime, type TimeFormatSetting } from '@/domain';
import { makeStyles } from '@/theme';

export interface ReminderPreviewCardProps {
  readonly remindersEnabled: boolean;
  readonly activeOffsets: readonly number[];
  readonly timeFormat: TimeFormatSetting;
}

export function ReminderPreviewCard({
  remindersEnabled,
  activeOffsets,
  timeFormat,
}: ReminderPreviewCardProps): ReactElement {
  const styles = useStyles();

  const getSubtitle = (): string => {
    if (!remindersEnabled || activeOffsets.length === 0) {
      return 'No alerts scheduled';
    }
    const sorted = [...activeOffsets].sort((a, b) => b - a);
    const times = sorted.map((m) => {
      const timeStr = formatMinutesToTime(420 - m, timeFormat);
      if (m >= 1440) {
        const days = Math.floor(m / 1440);
        return `${timeStr} (${days}d prior)`;
      }
      return timeStr;
    });
    return `Alerts at ${times.join(', ')}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Icon name="clock" size={20} tone="accent" />
      </View>
      <View style={styles.centerStack}>
        <Text variant="bodySmall" weight="semibold">
          Example: Day Shift (07:00)
        </Text>
        <Text variant="caption" tone="muted" tabularNums>
          {getSubtitle()}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.sizes.settingsRowMinHeight,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}));
