import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles, resolveShiftColor, useTheme } from '@/theme';

export interface ChipProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly iconName?: IconName;
  readonly color?: string;
  readonly selected?: boolean;
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
}

/**
 * Interactive pill/chip primitive with 44pt minimum touch target.
 * Supports leading icon, color indicator dot, and accessible role/state.
 */
export function Chip({
  label,
  onPress,
  iconName,
  color,
  selected = false,
  accessibilityLabel,
  disabled = false,
}: ChipProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = color !== undefined ? resolveShiftColor(color, theme.mode) : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipDefault,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      hitSlop={styles.hitSlop}
    >
      {resolvedColor !== undefined ? (
        <View style={[styles.colorDot, { backgroundColor: resolvedColor }]} />
      ) : null}
      {iconName !== undefined ? (
        <Icon name={iconName} size={16} tone={selected ? 'accent' : 'text'} />
      ) : null}
      <Text variant="bodySmall" weight="semibold" tone={selected ? 'accent' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  chip: {
    minHeight: theme.sizes.touchTarget,
    minWidth: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    gap: theme.spacing.xs,
  },
  chipDefault: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  colorDot: {
    width: theme.spacing.sm,
    height: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
}));
