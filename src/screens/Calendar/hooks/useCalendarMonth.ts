import { useCallback, useState } from 'react';
import { addMonths, getYearMonth, type LocalDate, type YearMonth } from '@/domain';

export interface CalendarMonthState {
  readonly visibleMonth: YearMonth;
  readonly selectedDate: LocalDate;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToDate: (date: LocalDate) => void;
  readonly selectDate: (date: LocalDate) => void;
}

/**
 * Screen-local state hook for the month grid.
 * Manages visible month navigation and date selection with stable callbacks.
 */
export function useCalendarMonth(initialDate: LocalDate): CalendarMonthState {
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(() => getYearMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState<LocalDate>(initialDate);

  const goToPreviousMonth = useCallback((): void => {
    setVisibleMonth((curr) => addMonths(curr, -1));
  }, []);

  const goToNextMonth = useCallback((): void => {
    setVisibleMonth((curr) => addMonths(curr, 1));
  }, []);

  const goToDate = useCallback((date: LocalDate): void => {
    setSelectedDate(date);
    setVisibleMonth(getYearMonth(date));
  }, []);

  const selectDate = useCallback((date: LocalDate): void => {
    setSelectedDate(date);
    const targetMonth = getYearMonth(date);
    setVisibleMonth((curr) =>
      curr.year === targetMonth.year && curr.month === targetMonth.month ? curr : targetMonth,
    );
  }, []);

  return {
    visibleMonth,
    selectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToDate,
    selectDate,
  };
}
