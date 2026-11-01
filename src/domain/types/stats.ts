import type { LocalDate } from './dates';
import type { ResolvedShift } from './resolvedShift';

export type StatsScope = 'to-date' | 'full-month';

export type CutoffTarget =
  Date | number | { readonly cutoffDate: LocalDate; readonly cutoffMinutes: number };

export interface ShiftBreakdownItem {
  readonly key: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isOff: boolean;
  readonly shiftCount: number;
  readonly totalNetMinutes: number;
  readonly totalBreakMinutes: number;
  readonly estimatedEarnings: number | null;
}

export interface MonthlyStatsSummary {
  readonly workingShiftCount: number;
  readonly offDayCount: number;
  readonly totalGrossMinutes: number;
  readonly totalBreakMinutes: number;
  readonly totalNetMinutes: number;
  readonly totalEstimatedEarnings: number | null;
  readonly breakdown: ReadonlyArray<ShiftBreakdownItem>;
}

export interface PayRuleContext {
  readonly shift: ResolvedShift;
  readonly netMinutes: number;
  readonly hourlyRate: number;
}

export type PayRule = (context: PayRuleContext) => number;

export interface CreatePayRulesOptions {
  readonly weekendMultiplier?: number;
  readonly overtimeThresholdMinutes?: number;
  readonly overtimeMultiplier?: number;
}

export interface ComputeMonthlyStatsOptions {
  readonly scope?: StatsScope | undefined;
  readonly cutoff?: CutoffTarget | undefined;
  readonly payRules?: ReadonlyArray<PayRule> | undefined;
}
