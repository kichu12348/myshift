import type { ReactElement } from 'react';
import { Switch as RNSwitch, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';

export interface SwitchProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
}

/**
 * Accessible toggle switch primitive themed with dusty rose accent in the ON state.
 * Encapsulated inside a 44x44 minimum touch target container.
 */
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: value, disabled }}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.accent,
        }}
        thumbColor={value ? theme.colors.surfaceRaised : theme.colors.textMuted}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
