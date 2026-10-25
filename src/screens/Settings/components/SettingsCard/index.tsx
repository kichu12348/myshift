import type { ReactElement, ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';

export type SettingsCardVariant = 'default' | 'outlined' | 'danger';

export interface SettingsCardProps {
  readonly children: ReactNode;
  readonly variant?: SettingsCardVariant;
  readonly style?: StyleProp<ViewStyle>;
}

export function SettingsCard({
  children,
  variant = 'default',
  style,
}: SettingsCardProps): ReactElement {
  const styles = useStyles();

  const variantStyle =
    variant === 'outlined'
      ? styles.variantOutlined
      : variant === 'danger'
        ? styles.variantDanger
        : styles.variantDefault;

  return <View style={[styles.card, variantStyle, style]}>{children}</View>;
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  variantDefault: {},
  variantOutlined: {
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  variantDanger: {
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.danger,
  },
}));
