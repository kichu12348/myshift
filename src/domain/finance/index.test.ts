import {
  DEFAULT_PAY_CYCLE_PROFILE,
  cloneMonthFinanceStructure,
  computeMonthlyWaterfall,
  computePayPeriodShiftEarnings,
  isFinanceRuleType,
  isFinanceValueMode,
  isPayCycleLengthUnit,
  resolvePayPeriodWindow,
  type MonthlyFinanceConfig,
  type MonthlyFinanceEntry,
  type PayCycleProfile,
} from './index';
import type { ResolvedShift } from '../types/resolvedShift';
import type { ShiftTemplate } from '../types/template';

describe('domain/finance', () => {
  describe('resolvePayPeriodWindow', () => {
    it('computes automatic 1-financial-month window for payday 25 in 2026-11 (2026-10-26 to 2026-11-25)', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '2026-11-25',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      const result = resolvePayPeriodWindow('2026-11', profile);

      expect(result.guessedStartDate).toBe('2026-10-26');
      expect(result.guessedEndDate).toBe('2026-11-25');
      expect(result.effectiveStartDate).toBe('2026-10-26');
      expect(result.effectiveEndDate).toBe('2026-11-25');
      expect(result.isDateRangeCustomized).toBe(false);
    });

    it('computes automatic 1-financial-month window when payday is 31 (spans 1st to last day of month)', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 31,
        anchorPaydayDate: '',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      // In November (30 days), clamped payday is 30th.
      // In October (31 days), clamped payday is 31st.
      // Previous payday + 1 = 2026-11-01.
      const result = resolvePayPeriodWindow('2026-11', profile);

      expect(result.guessedStartDate).toBe('2026-11-01');
      expect(result.guessedEndDate).toBe('2026-11-30');
      expect(result.effectiveStartDate).toBe('2026-11-01');
      expect(result.effectiveEndDate).toBe('2026-11-30');
      expect(result.isDateRangeCustomized).toBe(false);
    });

    it('clamps payday correctly for February (non-leap year 2026)', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 30,
        anchorPaydayDate: '',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      // In 2026-03, clamped payday is 30th.
      // In 2026-02 (28 days), clamped payday is 28th.
      // Previous payday + 1 = 2026-03-01.
      const result = resolvePayPeriodWindow('2026-03', profile);

      expect(result.guessedStartDate).toBe('2026-03-01');
      expect(result.guessedEndDate).toBe('2026-03-30');
    });

    it('computes automatic N-days cycle window projected from anchorPaydayDate', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '2026-10-28',
        cycleLengthUnit: 'days',
        cycleLengthDays: 28,
      };

      // 2026-10-28 + 28 days = 2026-11-25.
      // Guessed start date = addDays(2026-11-25, -27) = 2026-10-29.
      const result = resolvePayPeriodWindow('2026-11', profile);

      expect(result.guessedEndDate).toBe('2026-11-25');
      expect(result.guessedStartDate).toBe('2026-10-29');
      expect(result.effectiveStartDate).toBe('2026-10-29');
      expect(result.effectiveEndDate).toBe('2026-11-25');
      expect(result.isDateRangeCustomized).toBe(false);
    });

    it('applies manual customStartDate and customEndDate overrides', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      const config: MonthlyFinanceConfig = {
        monthKey: '2026-11',
        customStartDate: '2026-10-20',
        customEndDate: '2026-11-20',
        manualGrossOverride: null,
        notes: 'Adjusted for early holiday payroll',
      };

      const result = resolvePayPeriodWindow('2026-11', profile, config);

      expect(result.guessedStartDate).toBe('2026-10-26');
      expect(result.guessedEndDate).toBe('2026-11-25');
      expect(result.effectiveStartDate).toBe('2026-10-20');
      expect(result.effectiveEndDate).toBe('2026-11-20');
      expect(result.isDateRangeCustomized).toBe(true);
    });

    it('resets back to automatic guess when custom overrides are null', () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      const config: MonthlyFinanceConfig = {
        monthKey: '2026-11',
        customStartDate: null,
        customEndDate: null,
        manualGrossOverride: null,
        notes: '',
      };

      const result = resolvePayPeriodWindow('2026-11', profile, config);

      expect(result.effectiveStartDate).toBe('2026-10-26');
      expect(result.effectiveEndDate).toBe('2026-11-25');
      expect(result.isDateRangeCustomized).toBe(false);
    });
  });

  describe('computePayPeriodShiftEarnings', () => {
    const dayTemplate: ShiftTemplate = {
      id: 'template-day',
      name: 'Day',
      icon: 'sun',
      color: '#5B7DB1',
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 60,
      hourlyRate: 35,
      isOff: false,
      reminderOverride: null,
      archivedAt: null,
    };

    const templatesById = new Map<string, ShiftTemplate>([[dayTemplate.id, dayTemplate]]);

    it('computes earnings from shifts within the pay period window', () => {
      // 12-hour shift with 1 hour break = 11 net hours (660 minutes) @ $35/hr = $385.00
      const shift1: ResolvedShift = {
        id: 'shift-1',
        date: '2026-11-05',
        templateId: 'template-day',
        name: 'Day',
        icon: 'sun',
        color: '#5B7DB1',
        isOff: false,
        startsAt: new Date(2026, 10, 5, 7, 0).getTime(),
        endsAt: new Date(2026, 10, 5, 19, 0).getTime(),
        breakMinutes: 60,
        notes: '',
        rotationId: null,
        reminderOverride: null,
        origin: 'manual',
      };

      const shift2: ResolvedShift = {
        id: 'shift-2',
        date: '2026-11-10',
        templateId: 'template-day',
        name: 'Day',
        icon: 'sun',
        color: '#5B7DB1',
        isOff: false,
        startsAt: new Date(2026, 10, 10, 7, 0).getTime(),
        endsAt: new Date(2026, 10, 10, 19, 0).getTime(),
        breakMinutes: 60,
        notes: '',
        rotationId: null,
        reminderOverride: null,
        origin: 'manual',
      };

      // Shift outside the window
      const shiftOutside: ResolvedShift = {
        id: 'shift-outside',
        date: '2026-11-28',
        templateId: 'template-day',
        name: 'Day',
        icon: 'sun',
        color: '#5B7DB1',
        isOff: false,
        startsAt: new Date(2026, 10, 28, 7, 0).getTime(),
        endsAt: new Date(2026, 10, 28, 19, 0).getTime(),
        breakMinutes: 60,
        notes: '',
        rotationId: null,
        reminderOverride: null,
        origin: 'manual',
      };

      const earnings = computePayPeriodShiftEarnings({
        shifts: [shift1, shift2, shiftOutside],
        templatesById,
        effectiveStartDate: '2026-10-26',
        effectiveEndDate: '2026-11-25',
      });

      expect(earnings.workingShiftCount).toBe(2);
      expect(earnings.totalNetMinutes).toBe(1320); // 22 hours
      expect(earnings.autoGrossPay).toBe(770);
      expect(earnings.effectiveGrossPay).toBe(770);
      expect(earnings.isManualGrossOverride).toBe(false);
    });

    it('honors manualGrossOverride over autoGrossPay', () => {
      const shift1: ResolvedShift = {
        id: 'shift-1',
        date: '2026-11-05',
        templateId: 'template-day',
        name: 'Day',
        icon: 'sun',
        color: '#5B7DB1',
        isOff: false,
        startsAt: new Date(2026, 10, 5, 7, 0).getTime(),
        endsAt: new Date(2026, 10, 5, 19, 0).getTime(),
        breakMinutes: 60,
        notes: '',
        rotationId: null,
        reminderOverride: null,
        origin: 'manual',
      };

      const config: MonthlyFinanceConfig = {
        monthKey: '2026-11',
        customStartDate: null,
        customEndDate: null,
        manualGrossOverride: 5000,
        notes: '',
      };

      const earnings = computePayPeriodShiftEarnings({
        shifts: [shift1],
        templatesById,
        effectiveStartDate: '2026-10-26',
        effectiveEndDate: '2026-11-25',
        config,
      });

      expect(earnings.autoGrossPay).toBe(385);
      expect(earnings.effectiveGrossPay).toBe(5000);
      expect(earnings.isManualGrossOverride).toBe(true);
    });
  });

  describe('computeMonthlyWaterfall', () => {
    it('evaluates fixed and percentage entries, taxes first, and sequential balanceAfter', () => {
      const entries: MonthlyFinanceEntry[] = [
        {
          id: 'tax-1',
          monthKey: '2026-11',
          templateId: null,
          name: 'Federal Income Tax',
          category: 'tax',
          valueMode: 'percentage',
          value: 20, // 20% of 4000 = $800
          icon: 'shield',
          color: '#EF4444',
          sortOrder: 1,
          isPaid: false,
        },
        {
          id: 'tax-2',
          monthKey: '2026-11',
          templateId: null,
          name: 'City Tax',
          category: 'tax',
          valueMode: 'fixed',
          value: 100, // $100 fixed
          icon: 'shield',
          color: '#EF4444',
          sortOrder: 2,
          isPaid: false,
        },
        {
          id: 'exp-1',
          monthKey: '2026-11',
          templateId: null,
          name: 'Apartment Rent',
          category: 'expense',
          valueMode: 'fixed',
          value: 1500, // $1500 fixed
          icon: 'home',
          color: '#F97316',
          sortOrder: 3,
          isPaid: false,
        },
        {
          id: 'rem-1',
          monthKey: '2026-11',
          templateId: null,
          name: 'Family Remittance',
          category: 'remittance',
          valueMode: 'fixed',
          value: 500, // $500 fixed
          icon: 'send',
          color: '#8a70d6',
          sortOrder: 4,
          isPaid: false,
        },
        {
          id: 'sav-1',
          monthKey: '2026-11',
          templateId: null,
          name: 'Emergency Savings',
          category: 'savings',
          valueMode: 'percentage',
          value: 10, // 10% of 4000 = $400
          icon: 'archive',
          color: '#10B981',
          sortOrder: 5,
          isPaid: false,
        },
      ];

      const result = computeMonthlyWaterfall({
        entries,
        effectiveGrossPay: 4000,
        workingShiftCount: 10, // $400 / shift
      });

      expect(result.effectiveGrossPay).toBe(4000);
      expect(result.totalTaxes).toBe(900); // 800 + 100
      expect(result.netTakeHomePay).toBe(3100); // 4000 - 900
      expect(result.totalExpenses).toBe(1500);
      expect(result.totalRemittances).toBe(500);
      expect(result.totalSavings).toBe(400);

      // Final remaining balance: 3100 - (1500 + 500 + 400) = 700
      expect(result.finalRemainingBalance).toBe(700);
      expect(result.isOverdrawn).toBe(false);

      // Verify non-tax waterfall items sequential running balance
      const [rentItem, remittanceItem, savingsItem] = result.waterfallItems;
      expect(rentItem).toBeDefined();
      expect(remittanceItem).toBeDefined();
      expect(savingsItem).toBeDefined();

      // Rent: balanceBefore 3100, computedAmount 1500, balanceAfter 1600
      expect(rentItem?.balanceBefore).toBe(3100);
      expect(rentItem?.computedAmount).toBe(1500);
      expect(rentItem?.balanceAfter).toBe(1600);
      expect(rentItem?.isOverdrawn).toBe(false);
      expect(rentItem?.shiftsEquivalent).toBe(3.8); // 1500 / 400 = 3.75 -> 3.8

      // Remittance: balanceBefore 1600, computedAmount 500, balanceAfter 1100
      expect(remittanceItem?.balanceBefore).toBe(1600);
      expect(remittanceItem?.computedAmount).toBe(500);
      expect(remittanceItem?.balanceAfter).toBe(1100);
      expect(remittanceItem?.isOverdrawn).toBe(false);

      // Savings: balanceBefore 1100, computedAmount 400, balanceAfter 700
      expect(savingsItem?.balanceBefore).toBe(1100);
      expect(savingsItem?.computedAmount).toBe(400);
      expect(savingsItem?.balanceAfter).toBe(700);
      expect(savingsItem?.isOverdrawn).toBe(false);
      expect(savingsItem?.effectivePercentage).toBe(10);
    });

    it('flags isOverdrawn when balance drops below 0', () => {
      const entries: MonthlyFinanceEntry[] = [
        {
          id: 'exp-big',
          monthKey: '2026-11',
          templateId: null,
          name: 'Unexpected Car Repair',
          category: 'expense',
          valueMode: 'fixed',
          value: 2000,
          icon: 'tool',
          color: '#EF4444',
          sortOrder: 1,
          isPaid: false,
        },
      ];

      const result = computeMonthlyWaterfall({
        entries,
        effectiveGrossPay: 1500,
      });

      expect(result.netTakeHomePay).toBe(1500);
      expect(result.finalRemainingBalance).toBe(-500);
      expect(result.isOverdrawn).toBe(true);

      const [item] = result.waterfallItems;
      expect(item?.balanceBefore).toBe(1500);
      expect(item?.computedAmount).toBe(2000);
      expect(item?.balanceAfter).toBe(-500);
      expect(item?.isOverdrawn).toBe(true);
    });
  });

  describe('cloneMonthFinanceStructure', () => {
    it('clones entries into target month, resetting isPaid and generating fresh IDs', () => {
      const sourceEntries: MonthlyFinanceEntry[] = [
        {
          id: 'source-1',
          monthKey: '2026-10',
          templateId: 'tpl-rent',
          name: 'Rent',
          category: 'expense',
          valueMode: 'fixed',
          value: 1200,
          icon: 'home',
          color: '#F97316',
          sortOrder: 1,
          isPaid: true, // Marked as paid in previous month
        },
      ];

      let idCounter = 1;
      const fakeIdGen = (): string => `new-id-${idCounter++}`;

      const { entries, config } = cloneMonthFinanceStructure(sourceEntries, '2026-11', fakeIdGen);

      expect(entries).toHaveLength(1);
      const cloned = entries[0];
      expect(cloned?.id).toBe('new-id-1');
      expect(cloned?.monthKey).toBe('2026-11');
      expect(cloned?.name).toBe('Rent');
      expect(cloned?.category).toBe('expense');
      expect(cloned?.valueMode).toBe('fixed');
      expect(cloned?.value).toBe(1200);
      expect(cloned?.isPaid).toBe(false); // Reset to false!

      expect(config.monthKey).toBe('2026-11');
      expect(config.customStartDate).toBeNull();
      expect(config.customEndDate).toBeNull();
      expect(config.manualGrossOverride).toBeNull();
    });
  });

  describe('type guards', () => {
    it('validates rule types, value modes, and cycle units', () => {
      expect(isFinanceRuleType('tax')).toBe(true);
      expect(isFinanceRuleType('expense')).toBe(true);
      expect(isFinanceRuleType('remittance')).toBe(true);
      expect(isFinanceRuleType('savings')).toBe(true);
      expect(isFinanceRuleType('bonus')).toBe(false);

      expect(isFinanceValueMode('fixed')).toBe(true);
      expect(isFinanceValueMode('percentage')).toBe(true);
      expect(isFinanceValueMode('multiplier')).toBe(false);

      expect(isPayCycleLengthUnit('financial-month')).toBe(true);
      expect(isPayCycleLengthUnit('days')).toBe(true);
      expect(isPayCycleLengthUnit('weeks')).toBe(false);

      expect(DEFAULT_PAY_CYCLE_PROFILE.isConfigured).toBe(false);
      expect(DEFAULT_PAY_CYCLE_PROFILE.paydayDayOfMonth).toBe(25);
    });
  });
});
