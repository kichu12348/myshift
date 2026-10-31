import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { isShiftIconName } from '@/constants';
import type { ShiftTemplate } from '@/domain';
import { resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme, makeStyles } from '@/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export interface MiniWeekBannerProps {
  readonly presetId: string;
  readonly templates: readonly ShiftTemplate[];
}

export function MiniWeekBanner({ presetId, templates }: MiniWeekBannerProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const getDayTemplate = (dayIndex: number): ShiftTemplate | undefined => {
    if (templates.length === 0) {
      return undefined;
    }
    if (presetId === '12h-healthcare') {
      const dayTpl = templates.find((t) => t.id === 'default-day') ?? templates[0];
      const nightTpl = templates.find((t) => t.id === 'default-night') ?? templates[0];
      const offTpl = templates.find((t) => t.id === 'default-off') ?? templates[0];
      const pattern = [dayTpl, dayTpl, nightTpl, nightTpl, offTpl, offTpl, dayTpl];
      return pattern[dayIndex % pattern.length];
    }
    if (presetId === '8h-three-shift') {
      const morn = templates.find((t) => t.id === 'preset-8h-morning') ?? templates[0];
      const eve = templates.find((t) => t.id === 'preset-8h-evening') ?? templates[0];
      const night = templates.find((t) => t.id === 'preset-8h-night') ?? templates[0];
      const off = templates.find((t) => t.id === 'default-off') ?? templates[0];
      const pattern = [morn, morn, eve, eve, night, off, off];
      return pattern[dayIndex % pattern.length];
    }
    if (presetId === '24h-duty') {
      const duty = templates.find((t) => t.id === 'preset-24h-duty') ?? templates[0];
      const off = templates.find((t) => t.id === 'default-off') ?? templates[0];
      const pattern = [duty, off, off, duty, off, off, off];
      return pattern[dayIndex % pattern.length];
    }
    return templates[dayIndex % templates.length];
  };

  return (
    <View style={styles.card} accessibilityLabel="7-day schedule preview banner">
      <View style={styles.headerRow}>
        <Icon name="calendar" size={16} tone="accent" />
        <Text variant="caption" weight="semibold" tone="text">
          LIVE PREVIEW · 7-DAY SCHEDULE
        </Text>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((weekday, index) => {
          const tpl = getDayTemplate(index);
          const resolvedColor = resolveShiftColor(tpl ? tpl.color : 'slate', theme.mode);
          const isOff = tpl?.isOff ?? false;
          const timeLabel = isOff ? 'OFF' : tpl ? tpl.startTime.slice(0, 5) : '--';
          const iconName = tpl !== undefined && isShiftIconName(tpl.icon) ? tpl.icon : 'calendar';

          return (
            <View key={`day-${index}`} style={styles.column}>
              <Text variant="caption" weight="semibold" tone="muted" style={styles.dayLabel}>
                {weekday}
              </Text>
              <View
                style={[
                  styles.block,
                  {
                    backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                  },
                ]}
              >
                <View style={styles.blockHeader}>
                  <Icon name={iconName} size={10} tone="text" />
                  <Text
                    variant="caption"
                    weight="semibold"
                    numberOfLines={1}
                    style={styles.shiftName}
                  >
                    {tpl?.name.slice(0, 4) ?? '--'}
                  </Text>
                </View>
                <Text variant="caption" tone="muted" numberOfLines={1} style={styles.timeText}>
                  {timeLabel}
                </Text>
              </View>
            </View>
          );
        })}
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
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dayLabel: {
    fontSize: theme.typography.size.micro,
  },
  block: {
    width: '100%',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    justifyContent: 'center',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.pillGapCompact,
  },
  shiftName: {
    fontSize: theme.typography.size.micro,
    lineHeight: theme.typography.lineHeight.micro,
  },
  timeText: {
    fontSize: theme.typography.size.micro,
    lineHeight: theme.typography.lineHeight.micro,
  },
}));
