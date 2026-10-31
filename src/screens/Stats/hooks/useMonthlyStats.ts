import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  computeMonthlyStats,
  getMonthDateRange,
  getYearMonth,
  resolveRange,
  type MonthlyStatsSummary,
  type ResolvedShift,
  type ShiftTemplate,
  type StatsScope,
  type YearMonth,
} from '@/domain';
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
  readonly scope: StatsScope;
  readonly setScope: (scope: StatsScope) => void;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
}

/**
 * Hook to manage visible month and calculate monthly shift stats.
 * Defaults to 'to-date' scope (Month to Date up to current date & time).
 */
export function useMonthlyStats(
  initialMonth?: YearMonth,
  initialScope: StatsScope = 'to-date',
  nowOverride?: Date,
): UseMonthlyStatsResult {
  const today = useToday();
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(
    () => initialMonth ?? getYearMonth(today),
  );
  const [scope, setScope] = useState<StatsScope>(initialScope);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { from, to } = useMemo(
    () => getMonthDateRange(visibleMonth),
    [visibleMonth.year, visibleMonth.month],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      useShiftStore.getState().loadRange(from, to),
      useRotationStore.getState().loadExceptions(from, to),
    ])
      .then(() => {
        if (!cancelled) {
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
  }, [from, to]);

  const shifts = useShiftStore(selectShifts);
  const exceptions = useRotationStore(selectExceptions);
  const rotations = useRotationStore(selectRotations);
  const templates = useTemplateStore(selectTemplates);

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
      exceptions,
      manualShifts: shifts,
      templatesById,
    });
  }, [from, to, rotations, exceptions, shifts, templatesById]);

  const summary = useMemo(() => {
    const allShifts: ResolvedShift[] = [];
    for (const day of resolvedDays.values()) {
      for (const shift of day.shifts) {
        allShifts.push(shift);
      }
    }
    return computeMonthlyStats(allShifts, templatesById, {
      scope,
      cutoff: nowOverride ?? new Date(),
    });
  }, [resolvedDays, templatesById, scope, today, nowOverride]);

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
    scope,
    setScope,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  };
}
