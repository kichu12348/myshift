import { useCallback, useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MONTH_NAMES } from '@/constants';
import {
  DEFAULT_APP_SETTINGS,
  getMonthGrid,
  getYearMonth,
  type LocalDate,
  type WeekStart,
} from '@/domain';
import { useToday } from '@/hooks';
import { haptics } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';
import { MonthGrid } from './components/MonthGrid';
import { MonthHeader } from './components/MonthHeader';
import { WeekdayRow } from './components/WeekdayRow';
import { useCalendarMonth } from './hooks/useCalendarMonth';

/**
 * Calendar screen displaying a full month grid, header navigation, and weekday column labels.
 */
export function CalendarScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const today = useToday();
  const settings = useSettingsStore(selectSettings);
  const weekStart: WeekStart = settings?.weekStart ?? DEFAULT_APP_SETTINGS.weekStart;

  const state = useCalendarMonth(today);
  const { visibleMonth, selectedDate, selectDate, goToDate, goToPreviousMonth, goToNextMonth } =
    state;


  const weeks = useMemo(
    () => getMonthGrid(visibleMonth, weekStart),
    [visibleMonth, weekStart],
  );

  const monthIndex = visibleMonth.month - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? '';
  const title = `${monthName} ${visibleMonth.year}`;

  const todayYearMonth = getYearMonth(today);
  const showTodayButton =
    visibleMonth.year !== todayYearMonth.year ||
    visibleMonth.month !== todayYearMonth.month;

  const handleSelectDate = useCallback(
    (date: LocalDate): void => {
      haptics.selection();
      selectDate(date);
    },
    [selectDate],
  );

  const handleToday = useCallback((): void => {
    goToDate(today);
  }, [goToDate, today]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MonthHeader
        title={title}
        showTodayButton={showTodayButton}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={handleToday}
      />
      <WeekdayRow weekStart={weekStart} />
      <MonthGrid
        weeks={weeks}
        today={today}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />
    </View>
  );
}

export default CalendarScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
