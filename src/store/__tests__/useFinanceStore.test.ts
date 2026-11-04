import {
  useFinanceStore,
  selectFinanceStatus,
  selectMonthlyConfig,
  selectMonthlyEntries,
  selectPayCycleProfile,
} from '../useFinanceStore';
import type {
  FinanceTemplate,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  PayCycleProfile,
} from '@/domain';
import { DEFAULT_PAY_CYCLE_PROFILE } from '@/domain';

const mockGetPayCycleProfile = jest.fn<Promise<PayCycleProfile>, []>();
const mockSavePayCycleProfile = jest.fn<Promise<void>, [profile: PayCycleProfile]>();
const mockGetMonthlyConfig = jest.fn<Promise<MonthlyFinanceConfig | null>, [monthKey: string]>();
const mockUpsertMonthlyConfig = jest.fn<Promise<void>, [config: MonthlyFinanceConfig]>();
const mockGetMonthlyEntries = jest.fn<Promise<MonthlyFinanceEntry[]>, [monthKey: string]>();
const mockUpsertMonthlyEntry = jest.fn<Promise<void>, [entry: MonthlyFinanceEntry]>();
const mockDeleteMonthlyEntry = jest.fn<Promise<void>, [id: string]>();
const mockSetEntryPaid = jest.fn<Promise<void>, [id: string, isPaid: boolean]>();
const mockInsertMonthlyEntries = jest.fn<
  Promise<void>,
  [entries: ReadonlyArray<MonthlyFinanceEntry>]
>();
const mockGetTemplates = jest.fn<
  Promise<FinanceTemplate[]>,
  [options?: { readonly includeInactive?: boolean }]
>();
const mockUpsertTemplate = jest.fn<Promise<void>, [template: FinanceTemplate]>();
const mockDeleteTemplate = jest.fn<Promise<void>, [id: string]>();
const mockGetConfiguredMonths = jest.fn<Promise<string[]>, []>();

jest.mock('@/db', () => ({
  repositories: {
    finance: {
      getPayCycleProfile: () => mockGetPayCycleProfile(),
      savePayCycleProfile: (profile: PayCycleProfile) => mockSavePayCycleProfile(profile),
      getMonthlyConfig: (monthKey: string) => mockGetMonthlyConfig(monthKey),
      upsertMonthlyConfig: (config: MonthlyFinanceConfig) => mockUpsertMonthlyConfig(config),
      getMonthlyEntries: (monthKey: string) => mockGetMonthlyEntries(monthKey),
      upsertMonthlyEntry: (entry: MonthlyFinanceEntry) => mockUpsertMonthlyEntry(entry),
      deleteMonthlyEntry: (id: string) => mockDeleteMonthlyEntry(id),
      setEntryPaid: (id: string, isPaid: boolean) => mockSetEntryPaid(id, isPaid),
      insertMonthlyEntries: (entries: ReadonlyArray<MonthlyFinanceEntry>) =>
        mockInsertMonthlyEntries(entries),
      getTemplates: (options?: { readonly includeInactive?: boolean }) => mockGetTemplates(options),
      upsertTemplate: (template: FinanceTemplate) => mockUpsertTemplate(template),
      deleteTemplate: (id: string) => mockDeleteTemplate(id),
      getConfiguredMonths: () => mockGetConfiguredMonths(),
    },
  },
}));

describe('useFinanceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFinanceStore.setState({
      payCycleProfile: DEFAULT_PAY_CYCLE_PROFILE,
      templates: [],
      monthlyConfigs: {},
      monthlyEntries: {},
      status: 'idle',
      error: null,
    });
  });

  describe('payCycleProfile actions', () => {
    it('loads pay cycle profile and updates status to ready', async () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '2026-11-25',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      };

      mockGetPayCycleProfile.mockResolvedValueOnce(profile);

      await useFinanceStore.getState().loadPayCycleProfile();

      const state = useFinanceStore.getState();
      expect(selectFinanceStatus(state)).toBe('ready');
      expect(selectPayCycleProfile(state)).toEqual(profile);
    });

    it('sets status to error when loading pay cycle profile fails', async () => {
      mockGetPayCycleProfile.mockRejectedValueOnce(new Error('DB read error'));

      await useFinanceStore.getState().loadPayCycleProfile();

      const state = useFinanceStore.getState();
      expect(state.status).toBe('error');
      expect(state.error).toBe('DB read error');
    });

    it('saves valid pay cycle profile and persists to repository', async () => {
      const profile: PayCycleProfile = {
        isConfigured: true,
        paydayDayOfMonth: 15,
        anchorPaydayDate: '2026-11-15',
        cycleLengthUnit: 'days',
        cycleLengthDays: 14,
      };

      mockSavePayCycleProfile.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().savePayCycleProfile(profile);

      expect(mockSavePayCycleProfile).toHaveBeenCalledWith(profile);
      expect(useFinanceStore.getState().payCycleProfile).toEqual(profile);
    });

    it('rejects invalid paydayDayOfMonth or cycleLengthDays', async () => {
      await expect(
        useFinanceStore.getState().savePayCycleProfile({
          isConfigured: true,
          paydayDayOfMonth: 32, // invalid
          anchorPaydayDate: '',
          cycleLengthUnit: 'financial-month',
          cycleLengthDays: 28,
        }),
      ).rejects.toThrow('paydayDayOfMonth must be between 1 and 31');

      await expect(
        useFinanceStore.getState().savePayCycleProfile({
          isConfigured: true,
          paydayDayOfMonth: 25,
          anchorPaydayDate: '',
          cycleLengthUnit: 'days',
          cycleLengthDays: 0, // invalid
        }),
      ).rejects.toThrow('cycleLengthDays must be at least 1');
    });
  });

  describe('monthDateRangeOverride actions', () => {
    it('sets date range override and notifies repository', async () => {
      mockUpsertMonthlyConfig.mockResolvedValueOnce(undefined);

      await useFinanceStore
        .getState()
        .setMonthDateRangeOverride('2026-11', '2026-10-20', '2026-11-20');

      expect(mockUpsertMonthlyConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          monthKey: '2026-11',
          customStartDate: '2026-10-20',
          customEndDate: '2026-11-20',
        }),
      );

      const config = selectMonthlyConfig('2026-11')(useFinanceStore.getState());
      expect(config?.customStartDate).toBe('2026-10-20');
      expect(config?.customEndDate).toBe('2026-11-20');
    });

    it('resets date range override back to null', async () => {
      mockUpsertMonthlyConfig.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().setMonthDateRangeOverride('2026-11', null, null);

      const config = selectMonthlyConfig('2026-11')(useFinanceStore.getState());
      expect(config?.customStartDate).toBeNull();
      expect(config?.customEndDate).toBeNull();
    });

    it('rejects invalid date range where startDate is after endDate', async () => {
      await expect(
        useFinanceStore.getState().setMonthDateRangeOverride('2026-11', '2026-11-25', '2026-10-25'),
      ).rejects.toThrow('cannot be after');
    });
  });

  describe('manualGrossOverride actions', () => {
    it('sets manual gross override and resets with null', async () => {
      mockUpsertMonthlyConfig.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().setManualGrossOverride('2026-11', 4500);

      let config = selectMonthlyConfig('2026-11')(useFinanceStore.getState());
      expect(config?.manualGrossOverride).toBe(4500);

      mockUpsertMonthlyConfig.mockResolvedValueOnce(undefined);
      await useFinanceStore.getState().setManualGrossOverride('2026-11', null);

      config = selectMonthlyConfig('2026-11')(useFinanceStore.getState());
      expect(config?.manualGrossOverride).toBeNull();
    });

    it('rejects negative manual gross override', async () => {
      await expect(
        useFinanceStore.getState().setManualGrossOverride('2026-11', -100),
      ).rejects.toThrow('manualGrossOverride must be null or a non-negative number');
    });
  });

  describe('monthlyEntry actions', () => {
    const sampleEntry: MonthlyFinanceEntry = {
      id: 'entry-1',
      monthKey: '2026-11',
      templateId: null,
      name: 'Rent',
      category: 'expense',
      valueMode: 'fixed',
      value: 1200,
      icon: 'home',
      color: '#F97316',
      sortOrder: 1,
      isPaid: false,
    };

    it('upserts a monthly entry', async () => {
      mockUpsertMonthlyEntry.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().upsertMonthlyEntry('2026-11', sampleEntry);

      expect(mockUpsertMonthlyEntry).toHaveBeenCalledWith(sampleEntry);
      const entries = selectMonthlyEntries('2026-11')(useFinanceStore.getState());
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(sampleEntry);
    });

    it('toggles entry paid status', async () => {
      useFinanceStore.setState({
        monthlyEntries: {
          '2026-11': [sampleEntry],
        },
      });

      mockSetEntryPaid.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().toggleEntryPaid('2026-11', 'entry-1');

      expect(mockSetEntryPaid).toHaveBeenCalledWith('entry-1', true);
      const entries = selectMonthlyEntries('2026-11')(useFinanceStore.getState());
      expect(entries[0]?.isPaid).toBe(true);
    });

    it('deletes monthly entry', async () => {
      useFinanceStore.setState({
        monthlyEntries: {
          '2026-11': [sampleEntry],
        },
      });

      mockDeleteMonthlyEntry.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().deleteMonthlyEntry('2026-11', 'entry-1');

      expect(mockDeleteMonthlyEntry).toHaveBeenCalledWith('entry-1');
      const entries = selectMonthlyEntries('2026-11')(useFinanceStore.getState());
      expect(entries).toHaveLength(0);
    });
  });

  describe('financeTemplate actions', () => {
    const template: FinanceTemplate = {
      id: 'tpl-1',
      name: 'Savings 10%',
      category: 'savings',
      valueMode: 'percentage',
      value: 10,
      icon: 'archive',
      color: '#10B981',
      sortOrder: 1,
      isActive: true,
    };

    it('upserts finance template and deletes it', async () => {
      mockUpsertTemplate.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().upsertFinanceTemplate(template);

      expect(mockUpsertTemplate).toHaveBeenCalledWith(template);
      expect(useFinanceStore.getState().templates).toContainEqual(template);

      mockDeleteTemplate.mockResolvedValueOnce(undefined);
      await useFinanceStore.getState().deleteFinanceTemplate('tpl-1');

      expect(mockDeleteTemplate).toHaveBeenCalledWith('tpl-1');
      expect(useFinanceStore.getState().templates).toHaveLength(0);
    });
  });

  describe('copyStructureFromMonth', () => {
    it('clones structure into target month with clean overrides and unpaid status', async () => {
      const sourceEntry: MonthlyFinanceEntry = {
        id: 'source-1',
        monthKey: '2026-10',
        templateId: null,
        name: 'Rent',
        category: 'expense',
        valueMode: 'fixed',
        value: 1500,
        icon: 'home',
        color: '#F97316',
        sortOrder: 1,
        isPaid: true,
      };

      useFinanceStore.setState({
        monthlyEntries: {
          '2026-10': [sourceEntry],
        },
      });

      mockUpsertMonthlyConfig.mockResolvedValueOnce(undefined);
      mockInsertMonthlyEntries.mockResolvedValueOnce(undefined);

      await useFinanceStore.getState().copyStructureFromMonth('2026-10', '2026-11');

      expect(mockUpsertMonthlyConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          monthKey: '2026-11',
          customStartDate: null,
          customEndDate: null,
          manualGrossOverride: null,
        }),
      );

      const targetEntries = selectMonthlyEntries('2026-11')(useFinanceStore.getState());
      expect(targetEntries).toHaveLength(1);
      expect(targetEntries[0]?.name).toBe('Rent');
      expect(targetEntries[0]?.monthKey).toBe('2026-11');
      expect(targetEntries[0]?.isPaid).toBe(false);
      expect(targetEntries[0]?.id).not.toBe('source-1');
    });

    it('resets month to default templates and loads configured months', async () => {
      mockGetTemplates.mockResolvedValueOnce([]);
      mockInsertMonthlyEntries.mockResolvedValueOnce(undefined);
      mockGetConfiguredMonths.mockResolvedValueOnce(['2026-11', '2026-10']);

      await useFinanceStore.getState().resetMonthToDefaultTemplates('2026-11');

      const entries = selectMonthlyEntries('2026-11')(useFinanceStore.getState());
      expect(entries.length).toBe(6);
      expect(mockInsertMonthlyEntries).toHaveBeenCalledWith(expect.any(Array));

      const months = await useFinanceStore.getState().getConfiguredMonths();
      expect(months).toEqual(['2026-11', '2026-10']);
    });
  });
});
