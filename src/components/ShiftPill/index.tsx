import type { ReactElement } from 'react';
import { View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import { isOvernightShift, type ResolvedShift } from '@/domain';
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
}

function getSmartShiftLabel(name: string, isCompact: boolean): string {
  if (!isCompact) {
    return name;
  }
  const trimmed = name.trim();
  if (trimmed.length <= 5) {
    return trimmed;
  }
  return trimmed.slice(0, 4).trim();
}

/**
 * Visual pill representing a single shift assignment.
 * Supports compact capsules for calendar month cells and full pills for lists.
 * Dynamically resolves colors from shift templates with custom color tinting.
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
  const displayedName = getSmartShiftLabel(effectiveShiftName, isCompact);

  const containerStyle = isCompact
    ? [
        styles.base,
        styles.compactContainer,
        {
          backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
        },
      ]
    : [
        styles.base,
        styles.fullContainer,
        {
          backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
          borderLeftWidth: theme.sizes.pillBarWidth,
          borderLeftColor: resolvedColor,
        },
      ];

  const accessibilityLabel = isOffShift
    ? `${effectiveShiftName}, Off`
    : overnight
      ? `${effectiveShiftName}, overnight`
      : effectiveShiftName;

  return (
    <View accessibilityLabel={accessibilityLabel} style={containerStyle}>
      <Icon
        name={iconName}
        size={isCompact ? theme.sizes.compactIconSize : theme.sizes.iconSizeSmall}
        color={resolvedColor}
      />
      <Text
        variant={isCompact ? 'micro' : 'caption'}
        weight={isCompact ? 'semibold' : 'regular'}
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[styles.nameText, { color: resolvedColor }]}
      >
        {displayedName}
      </Text>
      {!isOffShift && overnight ? (
        <Text
          variant={isCompact ? 'micro' : 'caption'}
          weight={isCompact ? 'semibold' : 'regular'}
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
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  compactContainer: {
    height: theme.sizes.compactPillHeight,
    paddingHorizontal: theme.sizes.pillPaddingCompact,
    gap: theme.sizes.pillGapCompact,
  },
  fullContainer: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  nameText: {
    flex: 1,
  },
  overnightMarker: {
    flexShrink: 0,
  },
}));
