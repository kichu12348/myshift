import type {
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  MonthlyWaterfallResult,
  PayCycleProfile,
  PayPeriodShiftEarnings,
  PayPeriodWindowResult,
} from '@/domain';

export interface FinanceMonthData {
  readonly monthKey: string;
  readonly profile: PayCycleProfile;
  readonly config: MonthlyFinanceConfig | undefined;
  readonly entries: readonly MonthlyFinanceEntry[];
  readonly windowResult: PayPeriodWindowResult;
  readonly shiftEarnings: PayPeriodShiftEarnings;
  readonly waterfall: MonthlyWaterfallResult;
  readonly dailyAllowance: number;
  readonly unpaidBillsAmount: number;
  readonly isLoading: boolean;
}

export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split('.');
  const whole = parts[0] ?? '0';
  const decimal = parts[1] ?? '00';
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}$${withCommas}.${decimal}`;
}

export function formatDayOrdinal(day: number): string {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

