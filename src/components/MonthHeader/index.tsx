import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles, useTheme } from '@/theme';

export interface MonthHeaderProps {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly showTodayButton?: boolean | undefined;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onToday: () => void;
  readonly onTitlePress?: (() => void) | undefined;
  readonly onStatsPress?: (() => void) | undefined;
  readonly onRotations?: (() => void) | undefined;
  readonly previousLabel?: string | undefined;
  readonly nextLabel?: string | undefined;
}

/**
 * Shared header row for calendar and stats months.
 * Displays the current month title with chevron, monthly stats subtitle,
 * and a compact rounded pill holding chevron-left, Today, and chevron-right.
 */
export function MonthHeader({
  title,
  subtitle,
  showTodayButton = true,
  onPrevious,
  onNext,
  onToday,
  onTitlePress,
  onStatsPress,
  previousLabel,
  nextLabel,
}: MonthHeaderProps): ReactElement {
  const { theme } = useTheme();
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
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {title}
          </Text>
          {onTitlePress !== undefined ? (
            <Icon
              name="chevron-down"
              size={theme.sizes.iconSizeSmall}
              tone="muted"
              style={styles.chevron}
            />
          ) : null}
        </Pressable>
        {subtitle !== undefined ? (
          <Pressable
            disabled={onStatsPress === undefined}
            onPress={onStatsPress}
            accessibilityRole={onStatsPress !== undefined ? 'button' : undefined}
            accessibilityLabel={onStatsPress !== undefined ? `View stats: ${subtitle}` : undefined}
          >
            <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
              {subtitle}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.pillContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={previousLabel ?? 'Previous month'}
          onPress={onPrevious}
          style={({ pressed }) => [styles.pillNavButton, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={theme.sizes.iconSizeSmall} tone="text" />
        </Pressable>
        {showTodayButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to today"
            onPress={onToday}
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}
          >
            <Text variant="caption" weight="semibold" tone="text">
              Today
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextLabel ?? 'Next month'}
          onPress={onNext}
          style={({ pressed }) => [styles.pillNavButton, pressed && styles.pressed]}
        >
          <Icon name="chevron-right" size={theme.sizes.iconSizeSmall} tone="text" />
        </Pressable>
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
    gap: theme.sizes.size1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  chevron: {
    marginTop: theme.sizes.size1,
  },
  pillContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    height: theme.sizes.headerPillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillNavButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
}));
