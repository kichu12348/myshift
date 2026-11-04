import { addMonths, getMonthEndDate, getMonthStartDate } from '../calendar';
import { addDays, daysBetween, formatLocalDate, isLocalDate, parseLocalDate } from '../dates';
import type { LocalDate } from '../types/dates';
import { computeShiftDurationMinutes } from '../stats';
import type { ResolvedShift } from '../types/resolvedShift';
import type { ShiftTemplate } from '../types/template';
import type { PayRule } from '../types/stats';
import type {
  FinanceRuleType,
  FinanceTemplate,
  FinanceValueMode,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  MonthlyWaterfallResult,
  PayCycleLengthUnit,
  PayCycleProfile,
  PayPeriodShiftEarnings,
  PayPeriodWindowResult,
  WaterfallItem,
} from './types';

export * from './types';

export const DEFAULT_PAY_CYCLE_PROFILE: PayCycleProfile = {
  isConfigured: false,
  paydayDayOfMonth: 25,
  anchorPaydayDate: '',
  cycleLengthUnit: 'financial-month',
  cycleLengthDays: 28,
};

export const DEFAULT_FINANCE_TEMPLATES: ReadonlyArray<Omit<FinanceTemplate, 'id'>> = [
  {
    name: 'Income Tax',
    category: 'tax',
    valueMode: 'percentage',
    value: 20,
    icon: 'percent',
    color: '#EF4444',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Send Money Home',
    category: 'remittance',
    valueMode: 'fixed',
    value: 500,
    icon: 'send',
    color: '#5B7DB1',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Rent',
    category: 'expense',
    valueMode: 'fixed',
    value: 1200,
    icon: 'home',
    color: '#0EA5E9',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Utilities',
    category: 'expense',
    valueMode: 'fixed',
    value: 150,
    icon: 'zap',
    color: '#F59E0B',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Food',
    category: 'expense',
    valueMode: 'fixed',
    value: 400,
    icon: 'shopping-bag',
    color: '#10B981',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Internet',
    category: 'expense',
    valueMode: 'fixed',
    value: 60,
    icon: 'wifi',
    color: '#0EA5E9',
    sortOrder: 6,
    isActive: true,
  },
];

const ALLOWED_RULE_TYPES: readonly FinanceRuleType[] = [
  'tax',
  'expense',
  'remittance',
  'savings',
] as const;

const ALLOWED_VALUE_MODES: readonly FinanceValueMode[] = ['fixed', 'percentage'] as const;

const ALLOWED_CYCLE_UNITS: readonly PayCycleLengthUnit[] = ['financial-month', 'days'] as const;

export function isFinanceRuleType(value: unknown): value is FinanceRuleType {
  return typeof value === 'string' && (ALLOWED_RULE_TYPES as readonly string[]).includes(value);
}

export function isFinanceValueMode(value: unknown): value is FinanceValueMode {
  return typeof value === 'string' && (ALLOWED_VALUE_MODES as readonly string[]).includes(value);
}

export function isPayCycleLengthUnit(value: unknown): value is PayCycleLengthUnit {
  return typeof value === 'string' && (ALLOWED_CYCLE_UNITS as readonly string[]).includes(value);
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const parts = monthKey.split('-');
  const year = parts[0] !== undefined ? Number(parts[0]) : 0;
  const month = parts[1] !== undefined ? Number(parts[1]) : 0;

  if (year < 1900 || year > 2100 || month < 1 || month > 12) {
    throw new Error(`Invalid monthKey: ${monthKey}. Must be YYYY-MM format`);
  }

  return { year, month };
}

/**
 * Resolves the pay-period date window for a given monthKey.
 * First calculates the automatic guess based on the PayCycleProfile,
 * then applies any manual start/end date overrides from MonthlyFinanceConfig.
 */
export function resolvePayPeriodWindow(
  monthKey: string,
  profile: PayCycleProfile,
  config?: MonthlyFinanceConfig | null,
): PayPeriodWindowResult {
  const ym = parseMonthKey(monthKey);
  let guessedStartDate: LocalDate;
  let guessedEndDate: LocalDate;

  if (profile.cycleLengthUnit === 'financial-month') {
    // End date is paydayDayOfMonth inside monthKey (clamped to the days of this month)
    const monthEnd = getMonthEndDate(ym);
    const maxDaysThisMonth = parseLocalDate(monthEnd).day;
    const clampedThisMonth = Math.min(Math.max(1, profile.paydayDayOfMonth), maxDaysThisMonth);
    guessedEndDate = formatLocalDate(ym.year, ym.month, clampedThisMonth);

    // Start date is previous payday (in previous month, clamped) + 1 day
    const prevYm = addMonths(ym, -1);
    const prevMonthEnd = getMonthEndDate(prevYm);
    const maxDaysPrevMonth = parseLocalDate(prevMonthEnd).day;
    const clampedPrevMonth = Math.min(Math.max(1, profile.paydayDayOfMonth), maxDaysPrevMonth);
    const prevPayday = formatLocalDate(prevYm.year, prevYm.month, clampedPrevMonth);
    guessedStartDate = addDays(prevPayday, 1);
  } else {
    // cycleLengthUnit === 'days'
    const cycleDays = profile.cycleLengthDays > 0 ? profile.cycleLengthDays : 28;

    if (!isLocalDate(profile.anchorPaydayDate)) {
      // If anchor is unconfigured/invalid, fallback to month boundaries
      const monthStart = getMonthStartDate(ym);
      const monthEnd = getMonthEndDate(ym);
      guessedStartDate = monthStart;
      guessedEndDate = monthEnd;
    } else {
      const monthStart = getMonthStartDate(ym);
      const monthEnd = getMonthEndDate(ym);
      const anchor: import('../types/dates').LocalDate = profile.anchorPaydayDate;

      const dStart = daysBetween(anchor, monthStart);
      const dEnd = daysBetween(anchor, monthEnd);

      const kMin = Math.ceil(dStart / cycleDays);
      const kMax = Math.floor(dEnd / cycleDays);

      let k: number;
      if (kMin <= kMax) {
        // At least one payday in month; pick the last payday in the month
        k = kMax;
      } else {
        // No payday falls strictly in this month; pick the payday closest to monthEnd
        k = Math.round(dEnd / cycleDays);
      }

      guessedEndDate = addDays(anchor, k * cycleDays);
      guessedStartDate = addDays(guessedEndDate, -(cycleDays - 1));
    }
  }

  const effectiveStartDate = config?.customStartDate ?? guessedStartDate;
  const effectiveEndDate = config?.customEndDate ?? guessedEndDate;
  const isDateRangeCustomized =
    (config?.customStartDate !== null && config?.customStartDate !== undefined) ||
    (config?.customEndDate !== null && config?.customEndDate !== undefined);

  return {
    guessedStartDate,
    guessedEndDate,
    effectiveStartDate,
    effectiveEndDate,
    isDateRangeCustomized,
  };
}

export interface ComputePayPeriodShiftEarningsOptions {
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly templatesById: ReadonlyMap<string, ShiftTemplate>;
  readonly effectiveStartDate: string;
  readonly effectiveEndDate: string;
  readonly config?: MonthlyFinanceConfig | null;
  readonly mode?: 'full' | 'to-date';
  readonly referenceNow?: number | Date;
  readonly payRules?: ReadonlyArray<PayRule>;
}

/**
 * Calculates earnings from shifts within the effective pay period window.
 * Filters shifts falling in [effectiveStartDate..effectiveEndDate] and clamps up to referenceNow if mode === 'to-date'.
 */
export function computePayPeriodShiftEarnings(
  options: ComputePayPeriodShiftEarningsOptions,
): PayPeriodShiftEarnings {
  const {
    shifts,
    templatesById,
    effectiveStartDate,
    effectiveEndDate,
    config,
    mode = 'full',
    referenceNow,
    payRules,
  } = options;

  const cutoffTime =
    mode === 'to-date' && referenceNow !== undefined
      ? typeof referenceNow === 'number'
        ? referenceNow
        : referenceNow.getTime()
      : undefined;

  let workingShiftCount = 0;
  let totalNetMinutes = 0;
  let rawGrossPay = 0;

  for (const shift of shifts) {
    // Filter shifts within the date range [effectiveStartDate, effectiveEndDate]
    if (shift.date < effectiveStartDate || shift.date > effectiveEndDate) {
      continue;
    }

    if (cutoffTime !== undefined) {
      if (shift.isOff) {
        if (shift.startsAt > cutoffTime) {
          continue;
        }
      } else {
        if (shift.startsAt > cutoffTime) {
          continue;
        }
        const effectiveEnd = Math.min(shift.endsAt, cutoffTime);
        if (effectiveEnd <= shift.startsAt) {
          continue;
        }
      }
    }

    if (shift.isOff) {
      continue;
    }

    workingShiftCount += 1;
    const duration = computeShiftDurationMinutes(shift, cutoffTime);
    totalNetMinutes += duration.netMinutes;

    const template = shift.templateId !== null ? templatesById.get(shift.templateId) : undefined;
    const hourlyRate = template?.hourlyRate ?? null;

    if (hourlyRate !== null && hourlyRate > 0 && Number.isFinite(hourlyRate)) {
      if (payRules !== undefined && payRules.length > 0) {
        for (const rule of payRules) {
          rawGrossPay += rule({
            shift,
            netMinutes: duration.netMinutes,
            hourlyRate,
          });
        }
      } else {
        rawGrossPay += (duration.netMinutes / 60) * hourlyRate;
      }
    }
  }

  const autoGrossPay = Math.round(rawGrossPay * 100) / 100;
  const isManualGrossOverride =
    config?.manualGrossOverride !== null && config?.manualGrossOverride !== undefined;
  const effectiveGrossPay = isManualGrossOverride ? config.manualGrossOverride : autoGrossPay;

  return {
    autoGrossPay,
    effectiveGrossPay,
    totalNetMinutes,
    workingShiftCount,
    isManualGrossOverride,
  };
}

export interface ComputeWaterfallOptions {
  readonly entries: ReadonlyArray<MonthlyFinanceEntry>;
  readonly effectiveGrossPay: number;
  readonly workingShiftCount?: number;
}

/**
 * Pure waterfall ledger calculation supporting fixed ($) and percentage (%) values.
 * Evaluates tax entries first, producing netTakeHomePay, then evaluates non-tax entries sequentially.
 */
export function computeMonthlyWaterfall(options: ComputeWaterfallOptions): MonthlyWaterfallResult {
  const { entries, effectiveGrossPay, workingShiftCount } = options;

  const taxEntries = entries
    .filter((e) => e.category === 'tax')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const nonTaxEntries = entries
    .filter((e) => e.category !== 'tax')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const avgShiftPay =
    workingShiftCount !== undefined && workingShiftCount > 0 && effectiveGrossPay > 0
      ? effectiveGrossPay / workingShiftCount
      : 0;

  let currentTaxBalance = effectiveGrossPay;
  let totalTaxes = 0;
  const taxItems: WaterfallItem[] = [];

  for (const entry of taxEntries) {
    const computedAmount =
      entry.valueMode === 'percentage'
        ? Math.round(((effectiveGrossPay * entry.value) / 100) * 100) / 100
        : Math.round(entry.value * 100) / 100;

    const effectivePercentage =
      effectiveGrossPay > 0
        ? Math.round((computedAmount / effectiveGrossPay) * 100 * 100) / 100
        : 0;

    const balanceBefore = currentTaxBalance;
    const balanceAfter = Math.round((balanceBefore - computedAmount) * 100) / 100;
    const isOverdrawn = balanceAfter < 0;
    const shiftsEquivalent =
      avgShiftPay > 0 ? Math.round((computedAmount / avgShiftPay) * 10) / 10 : 0;

    totalTaxes = Math.round((totalTaxes + computedAmount) * 100) / 100;
    currentTaxBalance = balanceAfter;

    taxItems.push({
      entry,
      computedAmount,
      effectivePercentage,
      balanceBefore,
      balanceAfter,
      isOverdrawn,
      shiftsEquivalent,
    });
  }

  const netTakeHomePay = Math.round((effectiveGrossPay - totalTaxes) * 100) / 100;

  let runningBalance = netTakeHomePay;
  let totalExpenses = 0;
  let totalRemittances = 0;
  let totalSavings = 0;
  const waterfallItems: WaterfallItem[] = [];

  for (const entry of nonTaxEntries) {
    const computedAmount =
      entry.valueMode === 'percentage'
        ? Math.round(((effectiveGrossPay * entry.value) / 100) * 100) / 100
        : Math.round(entry.value * 100) / 100;

    const effectivePercentage =
      effectiveGrossPay > 0
        ? Math.round((computedAmount / effectiveGrossPay) * 100 * 100) / 100
        : 0;

    const balanceBefore = runningBalance;
    const balanceAfter = Math.round((balanceBefore - computedAmount) * 100) / 100;
    const isOverdrawn = balanceAfter < 0;
    const shiftsEquivalent =
      avgShiftPay > 0 ? Math.round((computedAmount / avgShiftPay) * 10) / 10 : 0;

    runningBalance = balanceAfter;

    if (entry.category === 'expense') {
      totalExpenses = Math.round((totalExpenses + computedAmount) * 100) / 100;
    } else if (entry.category === 'remittance') {
      totalRemittances = Math.round((totalRemittances + computedAmount) * 100) / 100;
    } else if (entry.category === 'savings') {
      totalSavings = Math.round((totalSavings + computedAmount) * 100) / 100;
    }

    waterfallItems.push({
      entry,
      computedAmount,
      effectivePercentage,
      balanceBefore,
      balanceAfter,
      isOverdrawn,
      shiftsEquivalent,
    });
  }

  const finalRemainingBalance = runningBalance;
  const isOverdrawn = finalRemainingBalance < 0;

  return {
    effectiveGrossPay,
    totalTaxes,
    netTakeHomePay,
    totalExpenses,
    totalRemittances,
    totalSavings,
    finalRemainingBalance,
    isOverdrawn,
    taxItems,
    waterfallItems,
    allItems: [...taxItems, ...waterfallItems],
  };
}

/**
 * Clones a month's finance entries into a target month.
 * Preserves each item's valueMode, value, category, name, icon, color, and sortOrder.
 * Initializes target items with isPaid = false, and fresh config with no overrides.
 */
export function cloneMonthFinanceStructure(
  sourceEntries: ReadonlyArray<MonthlyFinanceEntry>,
  targetMonthKey: string,
  idGenerator: () => string,
): {
  readonly entries: MonthlyFinanceEntry[];
  readonly config: MonthlyFinanceConfig;
} {
  const entries: MonthlyFinanceEntry[] = sourceEntries.map((entry) => ({
    id: idGenerator(),
    monthKey: targetMonthKey,
    templateId: entry.templateId,
    name: entry.name,
    category: entry.category,
    valueMode: entry.valueMode,
    value: entry.value,
    icon: entry.icon,
    color: entry.color,
    sortOrder: entry.sortOrder,
    isPaid: false,
  }));

  const config: MonthlyFinanceConfig = {
    monthKey: targetMonthKey,
    customStartDate: null,
    customEndDate: null,
    manualGrossOverride: null,
    notes: '',
  };

  return { entries, config };
}

/**
 * Generates initial monthly finance entries for a month from a list of finance templates.
 */
export function populateMonthFromTemplates(
  templates: ReadonlyArray<FinanceTemplate>,
  targetMonthKey: string,
  idGenerator: () => string,
): MonthlyFinanceEntry[] {
  return templates
    .filter((template) => template.isActive)
    .map((template, index) => ({
      id: idGenerator(),
      monthKey: targetMonthKey,
      templateId: template.id,
      name: template.name,
      category: template.category,
      valueMode: template.valueMode,
      value: template.value,
      icon: template.icon,
      color: template.color,
      sortOrder: template.sortOrder ?? index + 1,
      isPaid: false,
    }));
}
