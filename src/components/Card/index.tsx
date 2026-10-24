import type { ReactElement, ReactNode } from 'react';
import { View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';

export interface CardProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle> | undefined;
  readonly accessibilityLabel?: string | undefined;
  readonly accessibilityRole?: AccessibilityRole | undefined;
  readonly testID?: string | undefined;
}

/**
 * Standard surface card primitive.
 * Styled with surface background, border, radius, and standard padding.
 */
export function Card({
  children,
  style,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: CardProps): ReactElement {
  const styles = useStyles();

  return (
    <View
      style={[styles.card, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {children}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
}));
