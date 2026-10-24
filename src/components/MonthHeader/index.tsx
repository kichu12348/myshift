import type { ReactElement } from 'react';
import { View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { makeStyles } from '@/theme';

export interface MonthHeaderProps {
  readonly title: string;
  readonly showTodayButton: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onToday: () => void;
  readonly onRotations?: (() => void) | undefined;
  readonly previousLabel?: string | undefined;
  readonly nextLabel?: string | undefined;
}

/**
 * Shared header row for calendar and stats months.
 * Displays the current month title and action buttons (Today, previous/next month navigation, rotations).
 */
export function MonthHeader({
  title,
  showTodayButton,
  onPrevious,
  onNext,
  onToday,
  onRotations,
  previousLabel,
  nextLabel,
}: MonthHeaderProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="title" weight="semibold" style={styles.title}>
        {title}
      </Text>
      <View style={styles.actions}>
        {onRotations !== undefined ? (
          <IconButton iconName="repeat" accessibilityLabel="Rotations" onPress={onRotations} />
        ) : null}
        {showTodayButton ? (
          <TextButton label="Today" accessibilityLabel="Go to today" onPress={onToday} />
        ) : null}
        <IconButton
          iconName="chevron-left"
          accessibilityLabel={previousLabel ?? 'Previous month'}
          onPress={onPrevious}
        />
        <IconButton
          iconName="chevron-right"
          accessibilityLabel={nextLabel ?? 'Next month'}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
