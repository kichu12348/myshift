export type FinanceRuleType = 'tax' | 'expense' | 'remittance' | 'savings';

export type FinanceValueMode = 'fixed' | 'percentage';

export type PayCycleLengthUnit = 'financial-month' | 'days';

export interface PayCycleProfile {
  readonly isConfigured: boolean;
  readonly paydayDayOfMonth: number; // 1..31 (e.g., 25th)
  readonly anchorPaydayDate: string; // 'YYYY-MM-DD'
  readonly cycleLengthUnit: PayCycleLengthUnit; // 'financial-month' | 'days'
  readonly cycleLengthDays: number; // Used when cycleLengthUnit === 'days' (default 28)
}

export interface FinanceTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: FinanceRuleType;
  readonly valueMode: FinanceValueMode;
  readonly value: number;
  readonly icon: string;
  readonly color: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface MonthlyFinanceEntry {
  readonly id: string;
  readonly monthKey: string; // 'YYYY-MM'
  readonly templateId: string | null;
  readonly name: string;
  readonly category: FinanceRuleType;
  readonly valueMode: FinanceValueMode;
  readonly value: number;
  readonly icon: string;
  readonly color: string;
  readonly sortOrder: number;
  readonly isPaid: boolean;
}

export interface MonthlyFinanceConfig {
  readonly monthKey: string; // 'YYYY-MM'
  readonly customStartDate: string | null; // 'YYYY-MM-DD' override (null = auto guess)
  readonly customEndDate: string | null; // 'YYYY-MM-DD' override (null = auto guess)
  readonly periodStartDate?: string | null | undefined; // 'YYYY-MM-DD' explicit start date
  readonly periodEndDate?: string | null | undefined; // 'YYYY-MM-DD' explicit end date
  readonly manualGrossOverride: number | null; // null = auto calculate from shifts
  readonly notes: string;
}

export interface PayPeriodWindowResult {
  readonly guessedStartDate: string;
  readonly guessedEndDate: string;
  readonly effectiveStartDate: string;
  readonly effectiveEndDate: string;
  readonly isDateRangeCustomized: boolean;
}

export interface PayPeriodShiftEarnings {
  readonly autoGrossPay: number;
  readonly effectiveGrossPay: number;
  readonly totalNetMinutes: number;
  readonly workingShiftCount: number;
  readonly isManualGrossOverride: boolean;
}

export interface WaterfallItem {
  readonly entry: MonthlyFinanceEntry;
  readonly computedAmount: number;
  readonly effectivePercentage: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly isOverdrawn: boolean;
  readonly shiftsEquivalent: number;
}

export interface MonthlyWaterfallResult {
  readonly effectiveGrossPay: number;
  readonly totalTaxes: number;
  readonly netTakeHomePay: number;
  readonly totalExpenses: number;
  readonly totalRemittances: number;
  readonly totalSavings: number;
  readonly finalRemainingBalance: number;
  readonly isOverdrawn: boolean;
  readonly taxItems: ReadonlyArray<WaterfallItem>;
  readonly waterfallItems: ReadonlyArray<WaterfallItem>;
  readonly allItems: ReadonlyArray<WaterfallItem>;
}
