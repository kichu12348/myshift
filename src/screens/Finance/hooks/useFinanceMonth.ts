import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  computeMonthlyWaterfall,
  computePayPeriodShiftEarnings,
  daysBetween,
  getYearMonth,
  isLocalDate,
  resolvePayPeriodWindow,
  resolveRange,
  type LocalDate,
  type ResolvedShift,
  type ShiftTemplate,
  type YearMonth,
} from '@/domain';
import { useToday } from '@/hooks';
import {
  selectExceptions,
  selectFinanceStatus,
  selectPayCycleProfile,
  selectRotations,
  selectShifts,
  selectTemplates,
  useFinanceStore,
  useRotationStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';
import type { FinanceMonthData } from '../types';

export interface UseFinanceMonthResult {
  readonly visibleMonth: YearMonth;
  readonly data: FinanceMonthData;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
  readonly setManualGross: (amount: number | null) => Promise<void>;
  readonly setPaydayCutoff: (day: number) => Promise<void>;
  readonly togglePaid: (entryId: string) => Promise<void>;
}

export function useFinanceMonth(initialMonth?: YearMonth): UseFinanceMonthResult {
  const today = useToday();
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(
    () => initialMonth ?? getYearMonth(today),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const monthKey = useMemo(() => {
    return `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, '0')}`;
  }, [visibleMonth]);

  const profile = useFinanceStore(selectPayCycleProfile);
  const financeStatus = useFinanceStore(selectFinanceStatus);
  const monthlyConfigs = useFinanceStore((s) => s.monthlyConfigs);
  const monthlyEntries = useFinanceStore((s) => s.monthlyEntries);

  const config = monthlyConfigs[monthKey];
  const entries = useMemo(() => monthlyEntries[monthKey] ?? [], [monthlyEntries, monthKey]);

  const windowResult = useMemo(() => {
    return resolvePayPeriodWindow(monthKey, profile, config);
  }, [monthKey, profile, config]);

  const effectiveStartDate: LocalDate = useMemo(() => {
    return isLocalDate(windowResult.effectiveStartDate)
      ? windowResult.effectiveStartDate
      : (windowResult.guessedStartDate as LocalDate);
  }, [windowResult.effectiveStartDate, windowResult.guessedStartDate]);

  const effectiveEndDate: LocalDate = useMemo(() => {
    return isLocalDate(windowResult.effectiveEndDate)
      ? windowResult.effectiveEndDate
      : (windowResult.guessedEndDate as LocalDate);
  }, [windowResult.effectiveEndDate, windowResult.guessedEndDate]);

  useEffect(() => {
    if (financeStatus === 'idle') {
      void useFinanceStore.getState().loadPayCycleProfile();
    }
  }, [financeStatus]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      useFinanceStore.getState().loadMonthData(monthKey),
      useShiftStore.getState().loadRange(effectiveStartDate, effectiveEndDate),
      useRotationStore.getState().loadExceptions(effectiveStartDate, effectiveEndDate),
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
  }, [monthKey, effectiveStartDate, effectiveEndDate]);

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
    return resolveRange(effectiveStartDate, effectiveEndDate, {
      rotations,
      exceptions,
      manualShifts: shifts,
      templatesById,
    });
  }, [effectiveStartDate, effectiveEndDate, rotations, exceptions, shifts, templatesById]);

  const allShifts = useMemo(() => {
    const list: ResolvedShift[] = [];
    for (const day of resolvedDays.values()) {
      for (const shift of day.shifts) {
        list.push(shift);
      }
    }
    return list;
  }, [resolvedDays]);

  const shiftEarnings = useMemo(() => {
    return computePayPeriodShiftEarnings({
      shifts: allShifts,
      templatesById,
      effectiveStartDate,
      effectiveEndDate,
      config: config ?? null,
    });
  }, [allShifts, templatesById, effectiveStartDate, effectiveEndDate, config]);

  const waterfall = useMemo(() => {
    return computeMonthlyWaterfall({
      entries,
      effectiveGrossPay: shiftEarnings.effectiveGrossPay,
      workingShiftCount: shiftEarnings.workingShiftCount,
    });
  }, [entries, shiftEarnings.effectiveGrossPay, shiftEarnings.workingShiftCount]);

  const daysRemaining = useMemo(() => {
    if (today >= effectiveStartDate && today <= effectiveEndDate) {
      return Math.max(1, daysBetween(today, effectiveEndDate) + 1);
    }
    if (today < effectiveStartDate) {
      return Math.max(1, daysBetween(effectiveStartDate, effectiveEndDate) + 1);
    }
    return 1;
  }, [today, effectiveStartDate, effectiveEndDate]);

  const dailyAllowance = useMemo(() => {
    if (waterfall.finalRemainingBalance <= 0) {
      return 0;
    }
    return waterfall.finalRemainingBalance / daysRemaining;
  }, [waterfall.finalRemainingBalance, daysRemaining]);

  const unpaidBillsAmount = useMemo(() => {
    return waterfall.waterfallItems
      .filter((item) => !item.entry.isPaid)
      .reduce((sum, item) => sum + item.computedAmount, 0);
  }, [waterfall.waterfallItems]);

  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth((curr) => addMonths(curr, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth((curr) => addMonths(curr, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setVisibleMonth(getYearMonth(today));
  }, [today]);

  const setManualGross = useCallback(
    async (amount: number | null): Promise<void> => {
      await useFinanceStore.getState().setManualGrossOverride(monthKey, amount);
    },
    [monthKey],
  );

  const setPaydayCutoff = useCallback(
    async (day: number): Promise<void> => {
      await useFinanceStore.getState().savePayCycleProfile({
        ...profile,
        paydayDayOfMonth: day,
      });
    },
    [profile],
  );

  const togglePaid = useCallback(
    async (entryId: string): Promise<void> => {
      await useFinanceStore.getState().toggleEntryPaid(monthKey, entryId);
    },
    [monthKey],
  );

  const data: FinanceMonthData = {
    monthKey,
    profile,
    config,
    entries,
    windowResult,
    shiftEarnings,
    waterfall,
    dailyAllowance,
    unpaidBillsAmount,
    isLoading,
  };

  return {
    visibleMonth,
    data,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setManualGross,
    setPaydayCutoff,
    togglePaid,
  };
}
