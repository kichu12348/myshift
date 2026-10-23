import { memo, type ReactElement } from 'react';
import { View } from 'react-native';
import { WEEKDAY_SHORT_NAMES } from '@/constants';
import { getWeekdayOrder, type WeekStart } from '@/domain';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface WeekdayRowProps {
  readonly weekStart: WeekStart;
}

/**
 * Static header row displaying weekday abbreviations in configured weekStart order.
 * Marked as non-interactive for accessibility.
 */
export const WeekdayRow = memo(function WeekdayRow({
  weekStart,
}: WeekdayRowProps): ReactElement {
  const styles = useStyles();
  const order = getWeekdayOrder(weekStart);

  return (
    <View style={styles.container} accessible={false} accessibilityElementsHidden aria-hidden>
      {order.map((dayOfWeek) => {
        const name = WEEKDAY_SHORT_NAMES[dayOfWeek] ?? '';
        return (
          <View key={dayOfWeek} style={styles.column}>
            <Text variant="caption" tone="muted" style={styles.text}>
              {name}
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
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: theme.sizes.hairline,
    borderBottomColor: theme.colors.border,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
}));
