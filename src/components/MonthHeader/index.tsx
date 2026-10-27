import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface MonthHeaderProps {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly showTodayButton?: boolean | undefined;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onToday: () => void;
  readonly onTitlePress?: (() => void) | undefined;
  readonly onRotations?: (() => void) | undefined;
  readonly previousLabel?: string | undefined;
  readonly nextLabel?: string | undefined;
}

/**
 * Shared header row for calendar and stats months.
 * Displays the current month title with chevron, monthly stats subtitle,
 * pill-shaped Today button, and compact navigation controls.
 */
export function MonthHeader({
  title,
  subtitle,
  showTodayButton = true,
  onPrevious,
  onNext,
  onToday,
  onTitlePress,
  onRotations,
  previousLabel,
  nextLabel,
}: MonthHeaderProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <Pressable
          disabled={onTitlePress === undefined}
          onPress={onTitlePress}
          accessibilityRole={onTitlePress !== undefined ? 'button' : undefined}
          accessibilityLabel={
            onTitlePress !== undefined ? `Select date, current: ${title}` : undefined
          }
          style={styles.titleRow}
        >
          <Text variant="display" weight="semibold">
            {title}
          </Text>
          <Icon name="chevron-down" size={20} tone="muted" style={styles.chevron} />
        </Pressable>
        {subtitle !== undefined ? (
          <Text variant="bodySmall" tone="muted" tabularNums>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {onRotations !== undefined ? (
          <IconButton iconName="repeat" accessibilityLabel="Rotations" onPress={onRotations} />
        ) : null}
        {showTodayButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to today"
            onPress={onToday}
            style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}
          >
            <Text variant="bodySmall" weight="semibold" tone="text">
              Today
            </Text>
          </Pressable>
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
    paddingVertical: theme.spacing.sm,
  },
  leftColumn: {
    flex: 1,
    gap: theme.sizes.size1 * 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  chevron: {
    marginTop: theme.sizes.size1 * 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  todayButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButtonPressed: {
    opacity: 0.7,
  },
}));
