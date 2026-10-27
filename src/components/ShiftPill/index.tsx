import type { ReactElement } from 'react';
import { View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  epochToTimeOfDay,
  isOvernightShift,
  parseTimeOfDay,
  type ResolvedShift,
  type TimeFormatSetting,
} from '@/domain';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { selectTemplates, useTemplateStore } from '@/store';
import {
  DEFAULT_SHIFT_COLOR,
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';

export interface ShiftPillProps {
  readonly name?: string | undefined;
  readonly icon?: string | undefined;
  readonly color?: string | undefined;
  readonly isOff?: boolean | undefined;
  readonly isOvernight?: boolean | undefined;
  readonly variant?: 'compact' | 'full' | undefined;
  readonly compact?: boolean | undefined;
  readonly templateId?: string | null | undefined;
  readonly shift?: ResolvedShift | undefined;
  readonly subtext?: string | undefined;
  readonly timeFormat?: TimeFormatSetting | undefined;
}

function formatShiftStartTime(startsAt: number, format: TimeFormatSetting = '24h'): string {
  const time = epochToTimeOfDay(startsAt);
  if (format === '24h') {
    return time;
  }
  const { hours, minutes } = parseTimeOfDay(time);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${h12} ${period}`
    : `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getCompactSubtext(
  name: string,
  shift: ResolvedShift | undefined,
  isOff: boolean,
  timeFormat: TimeFormatSetting = '24h',
  subtext?: string,
): string | undefined {
  if (subtext !== undefined) {
    return subtext;
  }
  if (isOff) {
    return name.trim().toLowerCase() === 'off' ? 'All day' : 'Off';
  }
  if (shift !== undefined) {
    return formatShiftStartTime(shift.startsAt, timeFormat);
  }
  return undefined;
}

/**
 * Visual shift block / pill component.
 * In compact mode (calendar cells), renders a 2-line stacked card with user template color,
 * left accent border, full shift name, and start time/duration.
 * In full mode (lists/sheets), renders a horizontal capsule with icon, name, and markers.
 */
export function ShiftPill({
  name,
  icon,
  color,
  isOff,
  isOvernight,
  variant = 'full',
  compact,
  templateId,
  shift,
  subtext,
  timeFormat,
}: ShiftPillProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const templates = useTemplateStore(selectTemplates);

  const effectiveShiftName = shift?.name ?? name ?? '';
  const rawIcon = shift?.icon ?? icon ?? DEFAULT_SHIFT_ICON;
  const iconName = isShiftIconName(rawIcon) ? rawIcon : DEFAULT_SHIFT_ICON;
  const isOffShift = shift?.isOff ?? isOff ?? false;
  const overnight = shift !== undefined ? isOvernightShift(shift) : (isOvernight ?? false);
  const effTemplateId = shift?.templateId ?? templateId;

  const template =
    effTemplateId != null ? templates.find((t) => t.id === effTemplateId) : undefined;
  const rawColor = template?.color ?? shift?.color ?? color ?? DEFAULT_SHIFT_COLOR;
  const resolvedColor = resolveShiftColor(rawColor, theme.mode);
  const isCompact = compact === true || variant === 'compact';

  const accessibilityLabel = isOffShift
    ? `${effectiveShiftName}, Off`
    : overnight
      ? `${effectiveShiftName}, overnight`
      : effectiveShiftName;

  if (isCompact) {
    const line2Text = getCompactSubtext(
      effectiveShiftName,
      shift,
      isOffShift,
      timeFormat,
      subtext,
    );

    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.compactCard,
          {
            backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
            borderLeftColor: resolvedColor,
          },
        ]}
      >
        <Text
          variant="micro"
          weight="semibold"
          numberOfLines={1}
          ellipsizeMode="clip"
          style={{ color: resolvedColor }}
        >
          {effectiveShiftName}
        </Text>
        {line2Text !== undefined ? (
          <Text variant="micro" tone="muted" tabularNums numberOfLines={1}>
            {line2Text}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fullContainer,
        {
          backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
          borderLeftColor: resolvedColor,
        },
      ]}
    >
      <Icon name={iconName} size={theme.sizes.iconSizeSmall} color={resolvedColor} />
      <Text
        variant="caption"
        weight="regular"
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[styles.nameText, { color: resolvedColor }]}
      >
        {effectiveShiftName}
      </Text>
      {!isOffShift && overnight ? (
        <Text
          variant="caption"
          weight="regular"
          numberOfLines={1}
          ellipsizeMode="clip"
          tabularNums
          style={[styles.overnightMarker, { color: resolvedColor }]}
        >
          +1
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  compactCard: {
    width: '100%',
    borderRadius: theme.sizes.shiftBlockRadius,
    borderLeftWidth: theme.sizes.selectedBorder,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.shiftBlockPaddingVertical,
    marginBottom: theme.sizes.shiftBlockMarginBottom,
    justifyContent: 'center',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderLeftWidth: theme.sizes.pillBarWidth,
  },
  nameText: {
    flex: 1,
  },
  overnightMarker: {
    flexShrink: 0,
  },
}));
