import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface SwitchProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
}

/**
 * Custom pill toggle switch primitive themed with accent color in the ON state.
 * Meets minimum 44x44 touch target via hitSlop.
 */
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps): ReactElement {
  const styles = useStyles();

  const handleToggle = (): void => {
    if (!disabled) {
      haptics.selection();
      onValueChange(!value);
    }
  };

  const handleValueChange = (val: boolean): void => {
    if (!disabled) {
      haptics.selection();
      onValueChange(val);
    }
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={handleToggle}
      aria-checked={value}
      hitSlop={styles.hitSlop}
      style={[
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        disabled && styles.disabled,
      ]}
      {...({ onValueChange: handleValueChange } as Record<string, unknown>)}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => {
  const verticalHitSlop = (theme.sizes.touchTarget - theme.sizes.switchTrackHeight) / 2;

  return {
    track: {
      width: theme.sizes.switchTrackWidth,
      height: theme.sizes.switchTrackHeight,
      borderRadius: theme.radius.full,
      padding: theme.spacing.xs,
      justifyContent: 'center',
    },
    trackOn: {
      backgroundColor: theme.colors.accent,
      alignItems: 'flex-end',
    },
    trackOff: {
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: theme.sizes.hairline,
      borderColor: theme.colors.border,
      alignItems: 'flex-start',
    },
    thumb: {
      width: theme.sizes.switchThumbSize,
      height: theme.sizes.switchThumbSize,
      borderRadius: theme.radius.full,
    },
    thumbOn: {
      backgroundColor: theme.colors.onAccent,
    },
    thumbOff: {
      backgroundColor: theme.colors.textMuted,
    },
    hitSlop: {
      top: verticalHitSlop,
      bottom: verticalHitSlop,
      left: theme.spacing.xs,
      right: theme.spacing.xs,
    },
    disabled: {
      opacity: 0.5,
    },
  };
});
