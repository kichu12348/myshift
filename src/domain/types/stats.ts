import type { ResolvedShift } from './resolvedShift';

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
