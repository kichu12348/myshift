import { useCallback, useState } from 'react';
import {
  addDays,
  addMonths,
  getYearMonth,
  type CalendarViewMode,
  type LocalDate,
  type YearMonth,
} from '@/domain';

export interface CalendarMonthState {
  readonly viewMode: CalendarViewMode;
  readonly visibleMonth: YearMonth;
  readonly selectedDate: LocalDate;
  readonly setViewMode: (mode: CalendarViewMode) => void;
  readonly goToPrevious: () => void;
  readonly goToNext: () => void;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToDate: (date: LocalDate) => void;
  readonly selectDate: (date: LocalDate) => void;
}

/**
 * Screen-local state hook for the calendar.
 * Manages view mode (month/week/day), visible month, and selected date.
 */
export function useCalendarMonth(initialDate: LocalDate): CalendarMonthState {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(() => getYearMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState<LocalDate>(initialDate);

  const goToPreviousMonth = useCallback((): void => {
    setVisibleMonth((curr) => addMonths(curr, -1));
  }, []);

  const goToNextMonth = useCallback((): void => {
    setVisibleMonth((curr) => addMonths(curr, 1));
  }, []);

  const goToPrevious = useCallback((): void => {
    if (viewMode === 'month') {
      setVisibleMonth((curr) => addMonths(curr, -1));
    } else if (viewMode === 'week') {
      setSelectedDate((curr) => {
        const next = addDays(curr, -7);
        setVisibleMonth(getYearMonth(next));
        return next;
      });
    } else {
      setSelectedDate((curr) => {
        const next = addDays(curr, -1);
        setVisibleMonth(getYearMonth(next));
        return next;
      });
    }
  }, [viewMode]);

  const goToNext = useCallback((): void => {
    if (viewMode === 'month') {
      setVisibleMonth((curr) => addMonths(curr, 1));
    } else if (viewMode === 'week') {
      setSelectedDate((curr) => {
        const next = addDays(curr, 7);
        setVisibleMonth(getYearMonth(next));
        return next;
      });
    } else {
      setSelectedDate((curr) => {
        const next = addDays(curr, 1);
        setVisibleMonth(getYearMonth(next));
        return next;
      });
    }
  }, [viewMode]);

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
    viewMode,
    visibleMonth,
    selectedDate,
    setViewMode,
    goToPrevious,
    goToNext,
    goToPreviousMonth,
    goToNextMonth,
    goToDate,
    selectDate,
  };
}
