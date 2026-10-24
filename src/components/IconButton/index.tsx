import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import type { TextTone } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface IconButtonProps {
  readonly iconName: IconName;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly tone?: TextTone;
  readonly disabled?: boolean;
}

/**
 * 44x44 minimum touch target icon-only button primitive.
 * Provides accessible labeling and quiet pressed/disabled visual states.
 */
export function IconButton({
  iconName,
  accessibilityLabel,
  onPress,
  tone = 'text',
  disabled = false,
}: IconButtonProps): ReactElement {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      hitSlop={styles.hitSlop}
    >
      <Icon name={iconName} size={24} tone={disabled ? 'muted' : tone} />
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  button: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitSlop: {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
}));
