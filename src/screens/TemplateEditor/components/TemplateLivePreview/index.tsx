import type { ReactElement } from 'react';
import { View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  formatDurationHoursMinutes,
  formatTimeOfDay,
  isOvernightShift,
  isTimeOfDay,
  timeOfDayToMinutes,
  type TimeFormatSetting,
} from '@/domain';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import {
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';

export interface TemplateLivePreviewProps {
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isOff: boolean;
  readonly startTime: string;
  readonly endTime: string;
  readonly breakMinutes: number;
  readonly timeFormat: TimeFormatSetting;
}

export function TemplateLivePreview({
  name,
  icon,
  color,
  isOff,
  startTime,
  endTime,
  breakMinutes,
  timeFormat,
}: TemplateLivePreviewProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = resolveShiftColor(color, theme.mode);
  const iconName = isShiftIconName(icon) ? icon : DEFAULT_SHIFT_ICON;
  const displayName = name.trim().length > 0 ? name.trim() : 'Shift Name';

  let timeSubtext = 'All day \u00B7 Non-working';
  let startFormatted = '07:00';

  if (!isOff) {
    const validStart = isTimeOfDay(startTime) ? startTime : '07:00';
    const validEnd = isTimeOfDay(endTime) ? endTime : '15:00';
    const startM = timeOfDayToMinutes(validStart);
    const endM = timeOfDayToMinutes(validEnd);
    const isOvernight = isOvernightShift(startM, endM, false);
    const elapsed = endM <= startM ? endM + 1440 - startM : endM - startM;
    const netMinutes = Math.max(0, elapsed - breakMinutes);
    startFormatted = formatTimeOfDay(validStart, timeFormat);
    const endFormatted = formatTimeOfDay(validEnd, timeFormat);
    const overnightSuffix = isOvernight ? ' (+1d)' : '';
    const durationFormatted = formatDurationHoursMinutes(netMinutes);
    timeSubtext = `${startFormatted} \u2013 ${endFormatted}${overnightSuffix} \u00B7 ${durationFormatted}`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
          ]}
        >
          <Icon name={iconName} size={20} color={resolvedColor} />
        </View>

        <View style={styles.meta}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {displayName}
          </Text>
          <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
            {timeSubtext}
          </Text>
        </View>
      </View>

      <View style={styles.blockPreview}>
        <View style={[styles.blockTopBand, { backgroundColor: resolvedColor }]}>
          <Icon name={iconName} size={theme.sizes.compactIconSize} tone="onAccent" />
          <Text
            variant="micro"
            weight="semibold"
            tone="onAccent"
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {displayName}
          </Text>
        </View>
        <View
          style={[
            styles.blockBottomBand,
            { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
          ]}
        >
          <Text
            variant="micro"
            weight="semibold"
            tabularNums
            numberOfLines={1}
            style={{ color: resolvedColor }}
          >
            {isOff ? 'AD' : startFormatted}
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  blockPreview: {
    width: theme.sizes.previewBlockWidth,
    borderRadius: theme.sizes.shiftBlockRadius,
    overflow: 'hidden',
  },
  blockTopBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.shiftBlockPaddingVertical,
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  blockBottomBand: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.shiftBlockPaddingVertical,
    paddingHorizontal: theme.spacing.xs,
  },
}));
