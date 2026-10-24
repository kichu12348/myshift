import { MS_PER_MINUTE } from './reminders';
import type { ResolvedShift } from './types/resolvedShift';
import type { ShiftTemplate } from './types/template';
import type {
  MonthlyStatsSummary,
  PayRule,
  PayRuleContext,
  ShiftBreakdownItem,
} from './types/stats';

/**
 * Computes gross, break, and net durations for a resolved shift in minutes.
 * Returns 0s for Off shifts or invalid intervals.
 */
export function computeShiftDurationMinutes(shift: ResolvedShift): {
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

  const grossMinutes = Math.round((shift.endsAt - shift.startsAt) / MS_PER_MINUTE);
  const breakMinutes = Math.max(0, shift.breakMinutes);
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

/**
 * Computes monthly aggregated working hours, Off days, earnings, and shift breakdown.
 */
export function computeMonthlyStats(
  shifts: ReadonlyArray<ResolvedShift>,
  templatesById: ReadonlyMap<string, ShiftTemplate>,
  payRules: ReadonlyArray<PayRule> = DEFAULT_PAY_RULES,
): MonthlyStatsSummary {
  let workingShiftCount = 0;
  let offDayCount = 0;
  let totalGrossMinutes = 0;
  let totalBreakMinutes = 0;
  let totalNetMinutes = 0;
  let totalAccumulatedEarnings = 0;
  let hasAnyEarnings = false;

  const breakdownMap = new Map<string, BreakdownAccumulator>();

  for (const shift of shifts) {
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
    const duration = computeShiftDurationMinutes(shift);
    totalGrossMinutes += duration.grossMinutes;
    totalBreakMinutes += duration.breakMinutes;
    totalNetMinutes += duration.netMinutes;

    acc.totalNetMinutes += duration.netMinutes;
    acc.totalBreakMinutes += duration.breakMinutes;

    const template =
      shift.templateId !== null ? templatesById.get(shift.templateId) : undefined;
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

  const breakdown: ShiftBreakdownItem[] = Array.from(breakdownMap.values()).map(
    (item) => ({
      key: item.key,
      name: item.name,
      icon: item.icon,
      color: item.color,
      isOff: item.isOff,
      shiftCount: item.shiftCount,
      totalNetMinutes: item.totalNetMinutes,
      totalBreakMinutes: item.totalBreakMinutes,
      estimatedEarnings: item.hasEarnings
        ? Math.round(item.accumulatedEarnings * 100) / 100
        : null,
    }),
  );

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
