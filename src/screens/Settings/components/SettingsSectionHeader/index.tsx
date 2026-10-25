import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface SettingsSectionHeaderProps {
  readonly title: string;
  readonly icon: IconName;
}

export function SettingsSectionHeader({
  title,
  icon,
}: SettingsSectionHeaderProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Icon name={icon} size={16} tone="accent" />
      <Text variant="bodySmall" weight="semibold" tone="muted" style={styles.title}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  title: {
    letterSpacing: 0.8,
  },
}));
