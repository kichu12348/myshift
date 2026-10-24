import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  computeMonthlyStats,
  getMonthDateRange,
  getYearMonth,
  resolveRange,
  type MonthlyStatsSummary,
  type ResolvedShift,
  type RotationException,
  type Shift,
  type ShiftTemplate,
  type YearMonth,
} from '@/domain';
import { repositories } from '@/db';
import { useToday } from '@/hooks';
import {
  selectExceptions,
  selectRotations,
  selectShifts,
  selectTemplates,
  useRotationStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';

export interface UseMonthlyStatsResult {
  readonly visibleMonth: YearMonth;
  readonly summary: MonthlyStatsSummary;
  readonly isLoading: boolean;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
}

/**
 * Hook to manage visible month and calculate monthly shift stats.
 */
export function useMonthlyStats(initialMonth?: YearMonth): UseMonthlyStatsResult {
  const today = useToday();
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(
    () => initialMonth ?? getYearMonth(today),
  );

  const [monthShifts, setMonthShifts] = useState<readonly Shift[]>([]);
  const [monthExceptions, setMonthExceptions] = useState<readonly RotationException[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { from, to } = useMemo(
    () => getMonthDateRange(visibleMonth),
    [visibleMonth.year, visibleMonth.month],
  );

  const shiftStoreShifts = useShiftStore(selectShifts);
  const rotationStoreExceptions = useRotationStore(selectExceptions);
  const rotations = useRotationStore(selectRotations);
  const templates = useTemplateStore(selectTemplates);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      repositories.shifts.getByDateRange(from, to),
      repositories.rotationExceptions.getByDateRange(from, to),
    ])
      .then(([shifts, exceptions]) => {
        if (!cancelled) {
          setMonthShifts(shifts);
          setMonthExceptions(exceptions);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, shiftStoreShifts, rotationStoreExceptions]);

  const templatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    for (const template of templates) {
      map.set(template.id, template);
    }
    return map;
  }, [templates]);

  const resolvedDays = useMemo(() => {
    return resolveRange(from, to, {
      rotations,
      exceptions: monthExceptions,
      manualShifts: monthShifts,
      templatesById,
    });
  }, [from, to, rotations, monthExceptions, monthShifts, templatesById]);

  const summary = useMemo(() => {
    const allShifts: ResolvedShift[] = [];
    for (const day of resolvedDays.values()) {
      for (const shift of day.shifts) {
        allShifts.push(shift);
      }
    }
    return computeMonthlyStats(allShifts, templatesById);
  }, [resolvedDays, templatesById]);

  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth((curr) => addMonths(curr, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth((curr) => addMonths(curr, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setVisibleMonth(getYearMonth(today));
  }, [today]);

  return {
    visibleMonth,
    summary,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  };
}
