import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  formatDurationHoursMinutes,
  formatTimeOfDay,
  isOvernightShift,
  timeOfDayToMinutes,
  type ShiftTemplate,
  type TimeFormatSetting,
} from '@/domain';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import {
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';

export interface TemplateRowProps {
  readonly template: ShiftTemplate;
  readonly timeFormat: TimeFormatSetting;
  readonly onPress: () => void;
  readonly isArchived?: boolean | undefined;
  readonly onRestore?: (() => void) | undefined;
}

export function TemplateRow({
  template,
  timeFormat,
  onPress,
  isArchived = false,
  onRestore,
}: TemplateRowProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = resolveShiftColor(template.color, theme.mode);
  const iconName = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

  let subtitle = 'All day \u00B7 Non-working';
  if (!template.isOff) {
    const startM = timeOfDayToMinutes(template.startTime);
    const endM = timeOfDayToMinutes(template.endTime);
    const isOvernight = isOvernightShift(startM, endM, false);
    const elapsed = endM <= startM ? endM + 1440 - startM : endM - startM;
    const netMinutes = Math.max(0, elapsed - template.breakMinutes);
    const startFormatted = formatTimeOfDay(template.startTime, timeFormat);
    const endFormatted = formatTimeOfDay(template.endTime, timeFormat);
    const overnightSuffix = isOvernight ? ' (+1d)' : '';
    const durationFormatted = formatDurationHoursMinutes(netMinutes);
    subtitle = `${startFormatted} \u2013 ${endFormatted}${overnightSuffix} \u00B7 ${durationFormatted}`;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${template.name} template`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
        ]}
      >
        <Icon name={iconName} size={20} color={resolvedColor} />
      </View>

      <View style={styles.center}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {template.name}
        </Text>
        <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        {isArchived && onRestore !== undefined ? (
          <TextButton
            label="Restore"
            tone="accent"
            onPress={onRestore}
            accessibilityLabel={`Restore ${template.name}`}
          />
        ) : (
          <>
            <View style={[styles.dot, { backgroundColor: resolvedColor }]} />
            <Icon name="chevron-right" size={16} tone="muted" />
          </>
        )}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: theme.sizes.templateDot,
    height: theme.sizes.templateDot,
    borderRadius: theme.radius.full,
  },
}));

