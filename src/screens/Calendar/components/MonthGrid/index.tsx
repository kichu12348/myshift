import type { ReactElement } from 'react';
import { View } from 'react-native';
import {
  getDayOfWeek,
  isWeekendDay,
  type CalendarDay,
  type LocalDate,
  type ResolvedDay,
  type ResolvedShift,
  type ShiftTemplate,
  type TimeFormatSetting,
  type WeekStart,
} from '@/domain';
import { makeStyles } from '@/theme';
import { DayCell } from '../DayCell';
import { WeekdayRow } from '../WeekdayRow';

const EMPTY_SHIFTS: ReadonlyArray<ResolvedShift> = [];

export interface MonthGridProps {
  readonly weeks: ReadonlyArray<ReadonlyArray<CalendarDay>>;
  readonly today: LocalDate;
  readonly selectedDate: LocalDate;
  readonly resolvedDays: ReadonlyMap<LocalDate, ResolvedDay>;
  readonly templatesById?: ReadonlyMap<string, ShiftTemplate> | undefined;
  readonly weekStart: WeekStart;
  readonly timeFormat?: TimeFormatSetting | undefined;
  readonly onSelectDate: (date: LocalDate) => void;
  readonly onLongPressDate?: ((date: LocalDate) => void) | undefined;
}

/**
 * 6x7 Month Grid component with integrated single-letter weekday header.
 * Wrapped in a clean rounded surface with horizontal week rows and borderless columns.
 */
export function MonthGrid({
  weeks,
  today,
  selectedDate,
  resolvedDays,
  templatesById,
  weekStart,
  timeFormat,
  onSelectDate,
  onLongPressDate,
}: MonthGridProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.gridContainer}>
      <WeekdayRow weekStart={weekStart} />
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
                templatesById={templatesById}
                timeFormat={timeFormat}
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

const useStyles = makeStyles((theme) => ({
  gridContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
  },
}));
