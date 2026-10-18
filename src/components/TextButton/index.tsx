import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export type TextButtonTone = 'accent' | 'text' | 'muted' | 'danger';

export interface TextButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: TextButtonTone;
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
}

/**
 * Text-only button primitive with 44pt minimum height and accessible touch area.
 * Uses the Text component with semibold bodySmall styling.
 */
export function TextButton({
  label,
  onPress,
  tone = 'accent',
  accessibilityLabel,
  disabled = false,
}: TextButtonProps): ReactElement {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      hitSlop={8}
    >
      <Text
        variant="bodySmall"
        weight="semibold"
        tone={disabled ? 'muted' : tone}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  button: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
}));
