import type { ReactElement } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Text } from '@/components/Text';

export interface StartupStatusProps {
  readonly status: 'loading' | 'error';
  readonly message?: string | undefined;
}

/**
 * Presentational screen displayed during database startup or migration error.
 */
export function StartupStatus({
  status,
  message,
}: StartupStatusProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <Text variant="body" tone="muted">
          Loading
        </Text>
      ) : (
        <View style={styles.errorContent}>
          <Text variant="title" tone="danger" weight="semibold">
            Failed to initialize database
          </Text>
          {message !== undefined && message.length > 0 ? (
            <Text variant="bodySmall" tone="muted" style={styles.errorMessage}>
              {message}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
  },
}));
