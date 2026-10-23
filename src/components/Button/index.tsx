import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly iconName?: IconName;
}

/**
 * Standard button primitive with 44pt minimum touch target.
 * Supports primary (accent), secondary (surface/border), and danger variants.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  iconName,
}: ButtonProps): ReactElement {
  const styles = useStyles();

  const variantStyle =
    variant === 'secondary'
      ? styles.variantSecondary
      : variant === 'danger'
        ? styles.variantDanger
        : styles.variantPrimary;

  const tone =
    variant === 'secondary'
      ? 'text'
      : 'onAccent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      hitSlop={styles.hitSlop}
    >
      <View style={styles.content}>
        {iconName !== undefined ? (
          <Icon name={iconName} size={16} tone={tone} />
        ) : null}
        <Text variant="bodySmall" weight="semibold" tone={tone}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  button: {
    minHeight: theme.sizes.touchTarget,
    minWidth: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  variantPrimary: {
    backgroundColor: theme.colors.accent,
  },
  variantSecondary: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  variantDanger: {
    backgroundColor: theme.colors.danger,
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
