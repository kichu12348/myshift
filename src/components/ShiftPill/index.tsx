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
  readonly templateId?: string | null | undefined;
  readonly shift?: ResolvedShift | undefined;
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
  variant = 'compact',
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
  const isCompact = variant === 'compact';

  const workingShiftStyle = isCompact
    ? {
        backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
      }
    : {
        backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
        borderLeftWidth: theme.sizes.pillBarWidth,
        borderLeftColor: resolvedColor,
      };

  const accessibilityLabel = isOffShift
    ? `${effectiveShiftName}, Off`
    : overnight
      ? `${effectiveShiftName}, overnight`
      : effectiveShiftName;

  const itemColor = isOffShift ? theme.colors.textMuted : resolvedColor;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        isCompact ? styles.compactContainer : styles.fullContainer,
        isOffShift ? styles.offContainer : workingShiftStyle,
      ]}
    >
      <Icon
        name={iconName}
        size={isCompact ? 12 : 16}
        color={itemColor}
      />
      <Text
        variant={isCompact ? 'micro' : 'caption'}
        weight={isCompact ? 'semibold' : 'regular'}
        numberOfLines={1}
        style={[styles.nameText, { color: itemColor }]}
      >
        {effectiveShiftName}
      </Text>
      {!isOffShift && overnight ? (
        <Text
          variant={isCompact ? 'micro' : 'caption'}
          weight={isCompact ? 'semibold' : 'regular'}
          tabularNums
          style={[styles.overnightMarker, { color: itemColor }]}
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
    paddingHorizontal: theme.spacing.xs,
    overflow: 'hidden',
  },
  compactContainer: {
    height: theme.sizes.compactPillHeight,
    gap: theme.spacing.xs,
  },
  fullContainer: {
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  offContainer: {
    backgroundColor: theme.colors.surface,
  },
  nameText: {
    flex: 1,
  },
  overnightMarker: {
    flexShrink: 0,
  },
}));
