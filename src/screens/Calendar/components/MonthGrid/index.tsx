import type { ReactElement } from 'react';
import { View } from 'react-native';
import {
  getDayOfWeek,
  isWeekendDay,
  type CalendarDay,
  type LocalDate,
  type ResolvedDay,
  type ResolvedShift,
} from '@/domain';
import { makeStyles } from '@/theme';
import { DayCell } from '../DayCell';

const EMPTY_SHIFTS: ReadonlyArray<ResolvedShift> = [];

export interface MonthGridProps {
  readonly weeks: ReadonlyArray<ReadonlyArray<CalendarDay>>;
  readonly today: LocalDate;
  readonly selectedDate: LocalDate;
  readonly resolvedDays: ReadonlyMap<LocalDate, ResolvedDay>;
  readonly onSelectDate: (date: LocalDate) => void;
  readonly onLongPressDate?: ((date: LocalDate) => void) | undefined;
}

/**
 * 6x7 Month Grid component.
 * Occupies the remaining screen height equally divided across 6 rows with 7 cells per row.
 */
export function MonthGrid({
  weeks,
  today,
  selectedDate,
  resolvedDays,
  onSelectDate,
  onLongPressDate,
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
            const dayResolved = resolvedDays.get(day.date);
            const shifts = dayResolved?.shifts ?? EMPTY_SHIFTS;

            return (
              <DayCell
                key={day.date}
                date={day.date}
                inMonth={day.inMonth}
                isToday={isToday}
                isSelected={isSelected}
                isWeekend={isWeekend}
                shifts={shifts}
                onPress={onSelectDate}
                onLongPress={onLongPressDate}
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
