import { memo, type ReactElement } from 'react';
import { View } from 'react-native';
import { WEEKDAY_SHORT_NAMES } from '@/constants';
import { getWeekdayOrder, isWeekendDay, type WeekStart } from '@/domain';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface WeekdayRowProps {
  readonly weekStart: WeekStart;
}

/**
 * Centered single-letter weekday header row (M T W T F S S) with weekend column tinting.
 * Marked as non-interactive for accessibility.
 */
export const WeekdayRow = memo(function WeekdayRow({ weekStart }: WeekdayRowProps): ReactElement {
  const styles = useStyles();
  const order = getWeekdayOrder(weekStart);

  return (
    <View style={styles.container} accessible={false} accessibilityElementsHidden aria-hidden>
      {order.map((dayOfWeek) => {
        const isWeekend = isWeekendDay(dayOfWeek);
        const letter = (WEEKDAY_SHORT_NAMES[dayOfWeek] ?? '').charAt(0);
        return (
          <View key={dayOfWeek} style={[styles.column, isWeekend && styles.columnWeekend]}>
            <Text variant="caption" weight="semibold" tone="muted" style={styles.text}>
              {letter}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  columnWeekend: {
    backgroundColor: theme.colors.weekendTint,
  },
  text: {
    textAlign: 'center',
  },
}));
