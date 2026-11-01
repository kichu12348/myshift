import { isWeekendDay } from './calendar';
import { getDayOfWeek, parseLocalDate } from './dates';
import { MS_PER_MINUTE } from './reminders';
import type { ResolvedShift } from './types/resolvedShift';
import type { ShiftTemplate } from './types/template';
import type {
  ComputeMonthlyStatsOptions,
  CreatePayRulesOptions,
  CutoffTarget,
  MonthlyStatsSummary,
  PayRule,
  PayRuleContext,
  ShiftBreakdownItem,
  StatsScope,
} from './types/stats';

/**
 * Resolves a CutoffTarget (Date, epoch ms timestamp, or { cutoffDate, cutoffMinutes })
 * into epoch milliseconds.
 */
export function resolveCutoffTimestamp(cutoff: CutoffTarget): number {
  if (typeof cutoff === 'number') {
    return cutoff;
  }
  if (cutoff instanceof Date) {
    return cutoff.getTime();
  }
  const { year, month, day } = parseLocalDate(cutoff.cutoffDate);
  const hours = Math.floor(cutoff.cutoffMinutes / 60);
  const minutes = cutoff.cutoffMinutes % 60;
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

/**
 * Computes gross, break, and net durations for a resolved shift in minutes.
 * If a cutoff target is provided, calculates duration elapsed up to the cutoff.
 * Returns 0s for Off shifts or invalid/future intervals.
 */
export function computeShiftDurationMinutes(
  shift: ResolvedShift,
  cutoff?: CutoffTarget,
): {
  readonly grossMinutes: number;
  readonly breakMinutes: number;
  readonly netMinutes: number;
} {
  if (shift.isOff || shift.endsAt <= shift.startsAt) {
    return {
      grossMinutes: 0,
      breakMinutes: 0,
      netMinutes: 0,
    };
  }

  const effectiveEnd =
    cutoff !== undefined ? Math.min(shift.endsAt, resolveCutoffTimestamp(cutoff)) : shift.endsAt;

  if (effectiveEnd <= shift.startsAt) {
    return {
      grossMinutes: 0,
      breakMinutes: 0,
      netMinutes: 0,
    };
  }

  const fullGrossMinutes = Math.round((shift.endsAt - shift.startsAt) / MS_PER_MINUTE);
  const grossMinutes = Math.round((effectiveEnd - shift.startsAt) / MS_PER_MINUTE);
  const progress = fullGrossMinutes > 0 ? grossMinutes / fullGrossMinutes : 1;
  const breakMinutes =
    progress >= 1
      ? Math.max(0, shift.breakMinutes)
      : Math.min(grossMinutes, Math.round(Math.max(0, shift.breakMinutes) * progress));
  const netMinutes = Math.max(0, grossMinutes - breakMinutes);

  return {
    grossMinutes,
    breakMinutes,
    netMinutes,
  };
}

/**
 * Base hourly pay calculation rule: (netMinutes / 60) * hourlyRate.
 */
export const baseHourlyPayRule: PayRule = (context: PayRuleContext): number => {
  return (context.netMinutes / 60) * context.hourlyRate;
};

/**
 * Strategy pay rule that adds an extra weekend premium when the shift falls on a weekend day
 * (Saturday or Sunday) and multiplier > 1: ((netMinutes / 60) * hourlyRate * (multiplier - 1)).
 */
export function weekendMultiplierPayRule(multiplier: number): PayRule {
  return (context: PayRuleContext): number => {
    if (multiplier <= 1 || !isWeekendDay(getDayOfWeek(context.shift.date))) {
      return 0;
    }
    return (context.netMinutes / 60) * context.hourlyRate * (multiplier - 1);
  };
}

/**
 * Strategy pay rule that adds overtime premium for net minutes exceeding thresholdMinutes
 * in a single shift: ((overtimeMinutes / 60) * hourlyRate * (multiplier - 1)).
 */
export function dailyOvertimePayRule(thresholdMinutes: number, multiplier: number): PayRule {
  return (context: PayRuleContext): number => {
    if (multiplier <= 1 || thresholdMinutes < 0 || context.netMinutes <= thresholdMinutes) {
      return 0;
    }
    const overtimeMinutes = context.netMinutes - thresholdMinutes;
    return (overtimeMinutes / 60) * context.hourlyRate * (multiplier - 1);
  };
}

/**
 * Creates a composed list of PayRule strategies starting with baseHourlyPayRule
 * and combining any enabled configurable multipliers (weekend, overtime).
 */
export function createPayRules(options?: CreatePayRulesOptions): ReadonlyArray<PayRule> {
  const rules: PayRule[] = [baseHourlyPayRule];

  if (options?.weekendMultiplier !== undefined && options.weekendMultiplier > 1) {
    rules.push(weekendMultiplierPayRule(options.weekendMultiplier));
  }

  if (
    options?.overtimeMultiplier !== undefined &&
    options.overtimeMultiplier > 1 &&
    options.overtimeThresholdMinutes !== undefined &&
    options.overtimeThresholdMinutes >= 0
  ) {
    rules.push(dailyOvertimePayRule(options.overtimeThresholdMinutes, options.overtimeMultiplier));
  }

  return rules;
}

export const DEFAULT_PAY_RULES: ReadonlyArray<PayRule> = [baseHourlyPayRule];

interface BreakdownAccumulator {
  readonly key: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isOff: boolean;
  shiftCount: number;
  totalNetMinutes: number;
  totalBreakMinutes: number;
  accumulatedEarnings: number;
  hasEarnings: boolean;
}

function isCutoffTarget(value: unknown): value is CutoffTarget {
  if (typeof value === 'number' || value instanceof Date) {
    return true;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'cutoffDate' in value &&
    'cutoffMinutes' in value
  ) {
    return true;
  }
  return false;
}

function isComputeMonthlyStatsOptions(value: unknown): value is ComputeMonthlyStatsOptions {
  return typeof value === 'object' && value !== null && !isCutoffTarget(value);
}

function parseMonthlyStatsArgs(
  payRulesOrOptions?: ReadonlyArray<PayRule> | ComputeMonthlyStatsOptions | CutoffTarget,
  optionsOrCutoff?: ComputeMonthlyStatsOptions | CutoffTarget,
): {
  readonly payRules: ReadonlyArray<PayRule>;
  readonly scope: StatsScope;
  readonly cutoff: CutoffTarget | undefined;
} {
  let payRules: ReadonlyArray<PayRule> = DEFAULT_PAY_RULES;
  let scope: StatsScope = 'full-month';
  let cutoff: CutoffTarget | undefined;

  if (Array.isArray(payRulesOrOptions)) {
    payRules = payRulesOrOptions;
    if (isComputeMonthlyStatsOptions(optionsOrCutoff)) {
      scope =
        optionsOrCutoff.scope ?? (optionsOrCutoff.cutoff !== undefined ? 'to-date' : 'full-month');
      cutoff = optionsOrCutoff.cutoff;
    } else if (isCutoffTarget(optionsOrCutoff)) {
      scope = 'to-date';
      cutoff = optionsOrCutoff;
    }
  } else if (isCutoffTarget(payRulesOrOptions)) {
    scope = 'to-date';
    cutoff = payRulesOrOptions;
  } else if (isComputeMonthlyStatsOptions(payRulesOrOptions)) {
    payRules = payRulesOrOptions.payRules ?? DEFAULT_PAY_RULES;
    scope =
      payRulesOrOptions.scope ??
      (payRulesOrOptions.cutoff !== undefined ? 'to-date' : 'full-month');
    cutoff = payRulesOrOptions.cutoff;
  }

  return { payRules, scope, cutoff };
}

/**
 * Computes monthly aggregated working hours, Off days, earnings, and shift breakdown.
 * Can be scoped to 'to-date' (up to the given cutoff) or 'full-month'.
 */
export function computeMonthlyStats(
  shifts: ReadonlyArray<ResolvedShift>,
  templatesById: ReadonlyMap<string, ShiftTemplate>,
  payRulesOrOptions?: ReadonlyArray<PayRule> | ComputeMonthlyStatsOptions | CutoffTarget,
  optionsOrCutoff?: ComputeMonthlyStatsOptions | CutoffTarget,
): MonthlyStatsSummary {
  const { payRules, scope, cutoff } = parseMonthlyStatsArgs(payRulesOrOptions, optionsOrCutoff);
  const cutoffTime =
    scope === 'to-date' && cutoff !== undefined ? resolveCutoffTimestamp(cutoff) : undefined;

  let workingShiftCount = 0;
  let offDayCount = 0;
  let totalGrossMinutes = 0;
  let totalBreakMinutes = 0;
  let totalNetMinutes = 0;
  let totalAccumulatedEarnings = 0;
  let hasAnyEarnings = false;

  const breakdownMap = new Map<string, BreakdownAccumulator>();

  for (const shift of shifts) {
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

    const groupKey = shift.isOff
      ? `off:${shift.name}`
      : shift.templateId !== null
        ? `template:${shift.templateId}`
        : `manual:${shift.name}:${shift.color}`;

    let acc = breakdownMap.get(groupKey);
    if (acc === undefined) {
      acc = {
        key: groupKey,
        name: shift.name,
        icon: shift.icon,
        color: shift.color,
        isOff: shift.isOff,
        shiftCount: 0,
        totalNetMinutes: 0,
        totalBreakMinutes: 0,
        accumulatedEarnings: 0,
        hasEarnings: false,
      };
      breakdownMap.set(groupKey, acc);
    }

    acc.shiftCount += 1;

    if (shift.isOff) {
      offDayCount += 1;
      continue;
    }

    workingShiftCount += 1;
    const duration = computeShiftDurationMinutes(shift, cutoffTime);
    totalGrossMinutes += duration.grossMinutes;
    totalBreakMinutes += duration.breakMinutes;
    totalNetMinutes += duration.netMinutes;

    acc.totalNetMinutes += duration.netMinutes;
    acc.totalBreakMinutes += duration.breakMinutes;

    const template = shift.templateId !== null ? templatesById.get(shift.templateId) : undefined;
    const hourlyRate = template?.hourlyRate ?? null;

    if (hourlyRate !== null && hourlyRate > 0 && Number.isFinite(hourlyRate)) {
      let shiftPay = 0;
      for (const rule of payRules) {
        shiftPay += rule({
          shift,
          netMinutes: duration.netMinutes,
          hourlyRate,
        });
      }
      acc.accumulatedEarnings += shiftPay;
      acc.hasEarnings = true;
      totalAccumulatedEarnings += shiftPay;
      hasAnyEarnings = true;
    }
  }

  const breakdown: ShiftBreakdownItem[] = Array.from(breakdownMap.values()).map((item) => ({
    key: item.key,
    name: item.name,
    icon: item.icon,
    color: item.color,
    isOff: item.isOff,
    shiftCount: item.shiftCount,
    totalNetMinutes: item.totalNetMinutes,
    totalBreakMinutes: item.totalBreakMinutes,
    estimatedEarnings: item.hasEarnings ? Math.round(item.accumulatedEarnings * 100) / 100 : null,
  }));

  breakdown.sort((a, b) => {
    if (a.isOff !== b.isOff) {
      return a.isOff ? 1 : -1;
    }
    if (!a.isOff) {
      if (b.totalNetMinutes !== a.totalNetMinutes) {
        return b.totalNetMinutes - a.totalNetMinutes;
      }
      return a.name.localeCompare(b.name);
    }
    if (b.shiftCount !== a.shiftCount) {
      return b.shiftCount - a.shiftCount;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    workingShiftCount,
    offDayCount,
    totalGrossMinutes,
    totalBreakMinutes,
    totalNetMinutes,
    totalEstimatedEarnings: hasAnyEarnings
      ? Math.round(totalAccumulatedEarnings * 100) / 100
      : null,
    breakdown,
  };
}

/**
 * Formats a duration in minutes into a clean tabular hours and minutes string.
 * Examples: 0 -> "0h", 45 -> "45m", 60 -> "1h", 750 -> "12h 30m"
 */
export function formatDurationHoursMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return '0h';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
