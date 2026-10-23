import type { ReactElement } from 'react';
import { View } from 'react-native';
import {
  getDayOfWeek,
  isWeekendDay,
  type CalendarDay,
  type LocalDate,
} from '@/domain';
import { makeStyles } from '@/theme';
import { DayCell } from '../DayCell';

export interface MonthGridProps {
  readonly weeks: ReadonlyArray<ReadonlyArray<CalendarDay>>;
  readonly today: LocalDate;
  readonly selectedDate: LocalDate;
  readonly onSelectDate: (date: LocalDate) => void;
}

/**
 * 6x7 Month Grid component.
 * Occupies the remaining screen height equally divided across 6 rows with 7 cells per row.
 */
export function MonthGrid({
  weeks,
  today,
  selectedDate,
  onSelectDate,
}: MonthGridProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.gridContainer}>
      {weeks.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {week.map((day) => {
            const dow = getDayOfWeek(day.date);
            const isWeekend = isWeekendDay(dow);
            const isToday = day.date === today;
            const isSelected = day.date === selectedDate;

            return (
              <DayCell
                key={day.date}
                date={day.date}
                inMonth={day.inMonth}
                isToday={isToday}
                isSelected={isSelected}
                isWeekend={isWeekend}
                onPress={onSelectDate}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  gridContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
}));
