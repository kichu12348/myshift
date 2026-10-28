import type { ReactElement } from 'react';
import { View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  formatMinutesToTime,
  isOvernightShift,
  timeOfDayToMinutes,
  type ResolvedShift,
  type ShiftTemplate,
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

function getShiftStartMinutes(
  shift: ResolvedShift | undefined,
  template: ShiftTemplate | undefined,
): number | undefined {
  if (shift !== undefined) {
    if (
      'startMinutes' in shift &&
      typeof (shift as { startMinutes?: unknown }).startMinutes === 'number'
    ) {
      return (shift as { startMinutes: number }).startMinutes;
    }
    const d = new Date(shift.startsAt);
    return d.getHours() * 60 + d.getMinutes();
  }
  if (template !== undefined) {
    return timeOfDayToMinutes(template.startTime);
  }
  return undefined;
}

function getCompactSubtext(
  shift: ResolvedShift | undefined,
  template: ShiftTemplate | undefined,
  isOff: boolean,
  timeFormat: TimeFormatSetting = '24h',
  subtext?: string,
): string {
  if (subtext !== undefined) {
    return subtext;
  }
  if (isOff) {
    return 'AD';
  }
  const startMins = getShiftStartMinutes(shift, template);
  if (startMins !== undefined) {
    return formatMinutesToTime(startMins, timeFormat);
  }
  return '';
}

/**
 * Visual shift block / pill component.
 * In compact mode (calendar cells), renders a Two-Tone 2-Line Stacked Block
 * with top band (icon + shift name in onAccent) and bottom band (start time or AD).
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
  timeFormat = '24h',
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
    const line2Text = getCompactSubtext(shift, template, isOffShift, timeFormat, subtext);

    return (
      <View accessibilityLabel={accessibilityLabel} style={styles.compactBlock}>
        <View style={[styles.compactTopBand, { backgroundColor: resolvedColor }]}>
          <Icon name={iconName} size={theme.sizes.compactIconSize} tone="onAccent" />
          <Text
            variant="micro"
            weight="semibold"
            tone="onAccent"
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {effectiveShiftName}
          </Text>
        </View>
        <View
          style={[
            styles.compactBottomBand,
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
            {line2Text}
          </Text>
        </View>
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
  compactBlock: {
    width: '100%',
    borderRadius: theme.sizes.shiftBlockRadius,
    overflow: 'hidden',
    marginBottom: theme.sizes.shiftBlockMarginBottom,
  },
  compactTopBand: {
    height: theme.sizes.shiftBlockTopHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.sizes.pillGapCompact,
    gap: theme.sizes.pillGapCompact,
  },
  compactBottomBand: {
    height: theme.sizes.shiftBlockBottomHeight,
    alignItems: 'center',
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
