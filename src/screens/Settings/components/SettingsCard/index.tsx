import { Children, Fragment, type ReactElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export type SettingsCardVariant = 'default' | 'danger';

export interface SettingsCardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly variant?: SettingsCardVariant;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function SettingsCard({
  title,
  children,
  variant = 'default',
  style,
  testID,
}: SettingsCardProps): ReactElement {
  const styles = useStyles();

  const validChildren = Children.toArray(children).filter(Boolean);
  const isDanger = variant === 'danger';

  return (
    <View style={styles.wrapper} testID={testID}>
      {title !== undefined && title.length > 0 ? (
        <View style={styles.titleContainer}>
          <Text variant="bodySmall" tone="muted" weight="semibold" style={styles.titleText}>
            {title.toUpperCase()}
          </Text>
        </View>
      ) : null}
      <View style={[styles.card, isDanger && styles.cardDanger, style]}>
        {validChildren.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    gap: theme.spacing.sm,
  },
  titleContainer: {
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  titleText: {
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardDanger: {
    borderWidth: theme.sizes.size1,
    borderColor: theme.colors.danger,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
}));
