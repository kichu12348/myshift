import {
  mapRowToFinanceTemplate,
  mapRowToMonthlyFinanceConfig,
  mapRowToMonthlyFinanceEntry,
  mapRowToPayCycleProfile,
} from '../financeRepository';
import { DataIntegrityError } from '../../errors';

describe('financeRepository row mapping and validation', () => {
  describe('mapRowToPayCycleProfile', () => {
    it('maps valid database row to domain PayCycleProfile', () => {
      const row = {
        id: 1,
        remindersEnabled: true,
        defaultMinutesBefore: [60],
        themeMode: 'dark' as const,
        weekStart: 1,
        timeFormat: '24h' as const,
        onboardingCompleted: true,
        hapticsEnabled: true,
        payCycleConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '2026-11-25',
        payCycleLengthUnit: 'financial-month' as const,
        payCycleLengthDays: 28,
      };

      const domain = mapRowToPayCycleProfile(row);
      expect(domain).toEqual({
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '2026-11-25',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      });
    });

    it('throws DataIntegrityError when paydayDayOfMonth is out of range', () => {
      const row = {
        id: 1,
        remindersEnabled: true,
        defaultMinutesBefore: [60],
        themeMode: 'dark' as const,
        weekStart: 1,
        timeFormat: '24h' as const,
        onboardingCompleted: true,
        hapticsEnabled: true,
        payCycleConfigured: true,
        paydayDayOfMonth: 45, // invalid
        anchorPaydayDate: '',
        payCycleLengthUnit: 'financial-month' as const,
        payCycleLengthDays: 28,
      };

      expect(() => mapRowToPayCycleProfile(row)).toThrow(DataIntegrityError);
    });

    it('throws DataIntegrityError when payCycleLengthUnit is invalid', () => {
      const row = {
        id: 1,
        remindersEnabled: true,
        defaultMinutesBefore: [60],
        themeMode: 'dark' as const,
        weekStart: 1,
        timeFormat: '24h' as const,
        onboardingCompleted: true,
        hapticsEnabled: true,
        payCycleConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '',
        payCycleLengthUnit: 'bi-weekly' as unknown as 'days',
        payCycleLengthDays: 28,
      };

      expect(() => mapRowToPayCycleProfile(row)).toThrow(DataIntegrityError);
    });
  });

  describe('mapRowToFinanceTemplate', () => {
    it('maps valid database row to domain FinanceTemplate', () => {
      const row = {
        id: 'tpl-rent',
        name: 'Rent',
        category: 'expense' as const,
        valueMode: 'fixed' as const,
        value: 1200,
        icon: 'home',
        color: '#F97316',
        sortOrder: 1,
        isActive: true,
      };

      const domain = mapRowToFinanceTemplate(row);
      expect(domain).toEqual({
        id: 'tpl-rent',
        name: 'Rent',
        category: 'expense',
        valueMode: 'fixed',
        value: 1200,
        icon: 'home',
        color: '#F97316',
        sortOrder: 1,
        isActive: true,
      });
    });

    it('throws DataIntegrityError on invalid category', () => {
      const row = {
        id: 'tpl-1',
        name: 'Bad Category',
        category: 'entertainment' as unknown as 'expense',
        valueMode: 'fixed' as const,
        value: 50,
        icon: 'play',
        color: '#F97316',
        sortOrder: 1,
        isActive: true,
      };

      expect(() => mapRowToFinanceTemplate(row)).toThrow(DataIntegrityError);
    });

    it('throws DataIntegrityError on invalid hex color', () => {
      const row = {
        id: 'tpl-1',
        name: 'Bad Color',
        category: 'expense' as const,
        valueMode: 'fixed' as const,
        value: 50,
        icon: 'play',
        color: 'red', // Not #RRGGBB
        sortOrder: 1,
        isActive: true,
      };

      expect(() => mapRowToFinanceTemplate(row)).toThrow(DataIntegrityError);
    });
  });

  describe('mapRowToMonthlyFinanceConfig', () => {
    it('maps valid database row to domain MonthlyFinanceConfig', () => {
      const row = {
        monthKey: '2026-11',
        customStartDate: '2026-10-26',
        customEndDate: '2026-11-25',
        manualGrossOverride: 4200.5,
        notes: 'November budget',
      };

      const domain = mapRowToMonthlyFinanceConfig(row);
      expect(domain).toEqual({
        monthKey: '2026-11',
        customStartDate: '2026-10-26',
        customEndDate: '2026-11-25',
        manualGrossOverride: 4200.5,
        notes: 'November budget',
      });
    });

    it('handles null overrides cleanly', () => {
      const row = {
        monthKey: '2026-11',
        customStartDate: null,
        customEndDate: null,
        manualGrossOverride: null,
        notes: '',
      };

      const domain = mapRowToMonthlyFinanceConfig(row);
      expect(domain).toEqual({
        monthKey: '2026-11',
        customStartDate: null,
        customEndDate: null,
        manualGrossOverride: null,
        notes: '',
      });
    });
  });

  describe('mapRowToMonthlyFinanceEntry', () => {
    it('maps valid database row to domain MonthlyFinanceEntry', () => {
      const row = {
        id: 'entry-1',
        monthKey: '2026-11',
        templateId: 'tpl-rent',
        name: 'Apartment Rent',
        category: 'expense' as const,
        valueMode: 'fixed' as const,
        value: 1500,
        icon: 'home',
        color: '#F97316',
        sortOrder: 1,
        isPaid: false,
      };

      const domain = mapRowToMonthlyFinanceEntry(row);
      expect(domain).toEqual({
        id: 'entry-1',
        monthKey: '2026-11',
        templateId: 'tpl-rent',
        name: 'Apartment Rent',
        category: 'expense',
        valueMode: 'fixed',
        value: 1500,
        icon: 'home',
        color: '#F97316',
        sortOrder: 1,
        isPaid: false,
      });
    });

    it('throws DataIntegrityError on invalid valueMode', () => {
      const row = {
        id: 'entry-1',
        monthKey: '2026-11',
        templateId: null,
        name: 'Tax',
        category: 'tax' as const,
        valueMode: 'dynamic' as unknown as 'fixed',
        value: 15,
        icon: 'shield',
        color: '#EF4444',
        sortOrder: 1,
        isPaid: false,
      };

      expect(() => mapRowToMonthlyFinanceEntry(row)).toThrow(DataIntegrityError);
    });
  });
});
