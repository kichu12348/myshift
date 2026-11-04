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
  type FinanceRuleType,
  type FinanceValueMode,
  type LocalDate,
  type MonthlyFinanceEntry,
  type ResolvedShift,
  type ShiftTemplate,
  type YearMonth,
} from '@/domain';
import { useToday } from '@/hooks';
import { createId } from '@/services';
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
  readonly primaryHourlyRate: number | null;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
  readonly setManualGross: (amount: number | null) => Promise<void>;
  readonly setPaydayCutoff: (day: number) => Promise<void>;
  readonly setPayPeriodDates: (startDate: string, endDate: string) => Promise<void>;
  readonly togglePaid: (entryId: string) => Promise<void>;
  readonly saveEntry: (params: {
    readonly id?: string | undefined;
    readonly name: string;
    readonly category: FinanceRuleType;
    readonly valueMode: FinanceValueMode;
    readonly value: number;
    readonly icon: string;
    readonly color: string;
    readonly saveAsTemplate: boolean;
  }) => Promise<void>;
  readonly deleteEntry: (id: string) => Promise<void>;
  readonly copyStructure: (sourceMonthKey: string) => Promise<void>;
  readonly resetToDefaultTemplates: () => Promise<void>;
  readonly getConfiguredMonths: () => Promise<string[]>;
  readonly updateBaseHourlyRate: (rate: number) => Promise<void>;
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

  const setPayPeriodDates = useCallback(
    async (startDate: string, endDate: string): Promise<void> => {
      await useFinanceStore.getState().setPayPeriodDates(monthKey, startDate, endDate);
    },
    [monthKey],
  );

  const togglePaid = useCallback(
    async (entryId: string): Promise<void> => {
      await useFinanceStore.getState().toggleEntryPaid(monthKey, entryId);
    },
    [monthKey],
  );

  const primaryWorkingTemplate = useMemo(() => {
    return templates.find((t) => !t.isOff && t.hourlyRate !== null && t.hourlyRate > 0) ?? templates.find((t) => !t.isOff);
  }, [templates]);

  const primaryHourlyRate = primaryWorkingTemplate?.hourlyRate ?? null;

  const saveEntry = useCallback(
    async (params: {
      readonly id?: string | undefined;
      readonly name: string;
      readonly category: FinanceRuleType;
      readonly valueMode: FinanceValueMode;
      readonly value: number;
      readonly icon: string;
      readonly color: string;
      readonly saveAsTemplate: boolean;
    }): Promise<void> => {
      const entryId = params.id ?? createId();
      const existing = entries.find((e) => e.id === entryId);
      const newEntry: MonthlyFinanceEntry = {
        id: entryId,
        monthKey,
        templateId: existing?.templateId ?? null,
        name: params.name,
        category: params.category,
        valueMode: params.valueMode,
        value: params.value,
        icon: params.icon,
        color: params.color,
        sortOrder: existing?.sortOrder ?? entries.length + 1,
        isPaid: existing?.isPaid ?? false,
      };

      await useFinanceStore.getState().upsertMonthlyEntry(monthKey, newEntry);

      if (params.saveAsTemplate) {
        await useFinanceStore.getState().upsertFinanceTemplate({
          id: createId(),
          name: params.name,
          category: params.category,
          valueMode: params.valueMode,
          value: params.value,
          icon: params.icon,
          color: params.color,
          sortOrder: entries.length + 1,
          isActive: true,
        });
      }
    },
    [monthKey, entries],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await useFinanceStore.getState().deleteMonthlyEntry(monthKey, id);
    },
    [monthKey],
  );

  const copyStructure = useCallback(
    async (sourceMonthKey: string): Promise<void> => {
      await useFinanceStore.getState().copyStructureFromMonth(sourceMonthKey, monthKey);
    },
    [monthKey],
  );

  const resetToDefaultTemplates = useCallback(
    async (): Promise<void> => {
      await useFinanceStore.getState().resetMonthToDefaultTemplates(monthKey);
    },
    [monthKey],
  );

  const getConfiguredMonths = useCallback(
    async (): Promise<string[]> => {
      return await useFinanceStore.getState().getConfiguredMonths();
    },
    [],
  );

  const updateBaseHourlyRate = useCallback(
    async (rate: number): Promise<void> => {
      if (primaryWorkingTemplate) {
        await useTemplateStore.getState().updateTemplate({
          ...primaryWorkingTemplate,
          hourlyRate: rate,
        });
      }
    },
    [primaryWorkingTemplate],
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
    primaryHourlyRate,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setManualGross,
    setPaydayCutoff,
    setPayPeriodDates,
    togglePaid,
    saveEntry,
    deleteEntry,
    copyStructure,
    resetToDefaultTemplates,
    getConfiguredMonths,
    updateBaseHourlyRate,
  };
}
