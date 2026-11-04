import { exportFullBackup, restoreDatabaseAndStores } from '../bootstrap';
import type {
  AppSettings,
  BackupPayload,
  FinanceTemplate,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  PayCycleProfile,
  Rotation,
  RotationException,
  Shift,
  ShiftTemplate,
} from '@/domain';
import {
  DEFAULT_APP_SETTINGS,
  parseBackupPayload,
} from '@/domain';

const mockSettingsGetOrCreate = jest.fn<Promise<AppSettings>, [defaults: AppSettings]>();
const mockSettingsUpdate = jest.fn<Promise<void>, [settings: AppSettings]>();

const mockTemplatesGetAll = jest.fn<
  Promise<ShiftTemplate[]>,
  [options?: { readonly includeArchived?: boolean }]
>();
const mockTemplatesInsertMany = jest.fn<
  Promise<void>,
  [templates: ReadonlyArray<ShiftTemplate>]
>();
const mockTemplatesDeleteAll = jest.fn<Promise<void>, []>();
const mockTemplatesSeedIfEmpty = jest.fn<
  Promise<boolean>,
  [defaults: ReadonlyArray<ShiftTemplate>]
>();

const mockRotationsGetAll = jest.fn<Promise<Rotation[]>, []>();
const mockRotationsInsertMany = jest.fn<Promise<void>, [rotations: ReadonlyArray<Rotation>]>();
const mockRotationsDeleteAll = jest.fn<Promise<void>, []>();

const mockExceptionsGetAll = jest.fn<Promise<RotationException[]>, []>();
const mockExceptionsInsertMany = jest.fn<
  Promise<void>,
  [exceptions: ReadonlyArray<RotationException>]
>();
const mockExceptionsDeleteAll = jest.fn<Promise<void>, []>();

const mockShiftsGetAll = jest.fn<Promise<Shift[]>, []>();
const mockShiftsInsertMany = jest.fn<Promise<void>, [shifts: ReadonlyArray<Shift>]>();
const mockShiftsDeleteAll = jest.fn<Promise<void>, []>();

const mockFinanceGetPayCycleProfile = jest.fn<Promise<PayCycleProfile>, []>();
const mockFinanceSavePayCycleProfile = jest.fn<Promise<void>, [profile: PayCycleProfile]>();
const mockFinanceGetTemplates = jest.fn<
  Promise<FinanceTemplate[]>,
  [options?: { readonly includeInactive?: boolean }]
>();
const mockFinanceGetAllConfigs = jest.fn<Promise<MonthlyFinanceConfig[]>, []>();
const mockFinanceGetAllEntries = jest.fn<Promise<MonthlyFinanceEntry[]>, []>();
const mockFinanceInsertManyTemplates = jest.fn<
  Promise<void>,
  [templates: ReadonlyArray<FinanceTemplate>]
>();
const mockFinanceInsertManyConfigs = jest.fn<
  Promise<void>,
  [configs: ReadonlyArray<MonthlyFinanceConfig>]
>();
const mockFinanceInsertMonthlyEntries = jest.fn<
  Promise<void>,
  [entries: ReadonlyArray<MonthlyFinanceEntry>]
>();
const mockFinanceDeleteAll = jest.fn<Promise<void>, []>();

jest.mock('@/db', () => ({
  repositories: {
    settings: {
      getOrCreate: (defaults: AppSettings) => mockSettingsGetOrCreate(defaults),
      update: (settings: AppSettings) => mockSettingsUpdate(settings),
    },
    templates: {
      getAll: (options?: { readonly includeArchived?: boolean }) => mockTemplatesGetAll(options),
      insertMany: (templates: ReadonlyArray<ShiftTemplate>) =>
        mockTemplatesInsertMany(templates),
      deleteAll: () => mockTemplatesDeleteAll(),
      seedIfEmpty: (defaults: ReadonlyArray<ShiftTemplate>) =>
        mockTemplatesSeedIfEmpty(defaults),
    },
    rotations: {
      getAll: () => mockRotationsGetAll(),
      insertMany: (rotations: ReadonlyArray<Rotation>) => mockRotationsInsertMany(rotations),
      deleteAll: () => mockRotationsDeleteAll(),
    },
    rotationExceptions: {
      getAll: () => mockExceptionsGetAll(),
      insertMany: (exceptions: ReadonlyArray<RotationException>) =>
        mockExceptionsInsertMany(exceptions),
      deleteAll: () => mockExceptionsDeleteAll(),
    },
    shifts: {
      getAll: () => mockShiftsGetAll(),
      insertMany: (shifts: ReadonlyArray<Shift>) => mockShiftsInsertMany(shifts),
      deleteAll: () => mockShiftsDeleteAll(),
    },
    finance: {
      getPayCycleProfile: () => mockFinanceGetPayCycleProfile(),
      savePayCycleProfile: (profile: PayCycleProfile) =>
        mockFinanceSavePayCycleProfile(profile),
      getTemplates: (options?: { readonly includeInactive?: boolean }) =>
        mockFinanceGetTemplates(options),
      getAllConfigs: () => mockFinanceGetAllConfigs(),
      getAllEntries: () => mockFinanceGetAllEntries(),
      insertManyTemplates: (templates: ReadonlyArray<FinanceTemplate>) =>
        mockFinanceInsertManyTemplates(templates),
      insertManyConfigs: (configs: ReadonlyArray<MonthlyFinanceConfig>) =>
        mockFinanceInsertManyConfigs(configs),
      insertMonthlyEntries: (entries: ReadonlyArray<MonthlyFinanceEntry>) =>
        mockFinanceInsertMonthlyEntries(entries),
      deleteAll: () => mockFinanceDeleteAll(),
    },
  },
}));

jest.mock('@/services', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/services');
  return {
    ...actual,
    reconcileReminders: jest.fn().mockResolvedValue(undefined),
  };
});

describe('bootstrap exportFullBackup and restoreDatabaseAndStores', () => {
  const sampleSettings: AppSettings = DEFAULT_APP_SETTINGS;

  const sampleTemplate: ShiftTemplate = {
    id: 'tpl-day',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 60,
    hourlyRate: 35,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  const sampleProfile: PayCycleProfile = {
    isConfigured: true,
    paydayDayOfMonth: 25,
    anchorPaydayDate: '2026-11-25',
    cycleLengthUnit: 'financial-month',
    cycleLengthDays: 28,
  };

  const sampleFinanceTemplate: FinanceTemplate = {
    id: 'fin-tpl-1',
    name: 'Tax',
    category: 'tax',
    valueMode: 'percentage',
    value: 20,
    icon: 'percent',
    color: '#EF4444',
    sortOrder: 1,
    isActive: true,
  };

  const sampleFinanceConfig: MonthlyFinanceConfig = {
    monthKey: '2026-11',
    customStartDate: '2026-10-26',
    customEndDate: '2026-11-25',
    periodStartDate: '2026-10-26',
    periodEndDate: '2026-11-25',
    manualGrossOverride: 4000,
    notes: 'Budget notes',
  };

  const sampleFinanceEntry: MonthlyFinanceEntry = {
    id: 'fin-entry-1',
    monthKey: '2026-11',
    templateId: 'fin-tpl-1',
    name: 'Tax',
    category: 'tax',
    valueMode: 'percentage',
    value: 20,
    icon: 'percent',
    color: '#EF4444',
    sortOrder: 1,
    isPaid: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports full backup payload including finance records', async () => {
    mockSettingsGetOrCreate.mockResolvedValueOnce(sampleSettings);
    mockTemplatesGetAll.mockResolvedValueOnce([sampleTemplate]);
    mockRotationsGetAll.mockResolvedValueOnce([]);
    mockExceptionsGetAll.mockResolvedValueOnce([]);
    mockShiftsGetAll.mockResolvedValueOnce([]);
    mockFinanceGetPayCycleProfile.mockResolvedValueOnce(sampleProfile);
    mockFinanceGetTemplates.mockResolvedValueOnce([sampleFinanceTemplate]);
    mockFinanceGetAllConfigs.mockResolvedValueOnce([sampleFinanceConfig]);
    mockFinanceGetAllEntries.mockResolvedValueOnce([sampleFinanceEntry]);

    const json = await exportFullBackup();
    const parsed = parseBackupPayload(json);

    expect(parsed.version).toBe(1);
    expect(parsed.settings).toEqual(sampleSettings);
    expect(parsed.templates).toEqual([sampleTemplate]);
    expect(parsed.payCycleProfile).toEqual(sampleProfile);
    expect(parsed.financeTemplates).toEqual([sampleFinanceTemplate]);
    expect(parsed.monthlyConfigs).toEqual([sampleFinanceConfig]);
    expect(parsed.monthlyEntries).toEqual([sampleFinanceEntry]);
  });

  it('restores database and stores including finance records and resets stores', async () => {
    mockShiftsDeleteAll.mockResolvedValueOnce(undefined);
    mockExceptionsDeleteAll.mockResolvedValueOnce(undefined);
    mockRotationsDeleteAll.mockResolvedValueOnce(undefined);
    mockTemplatesDeleteAll.mockResolvedValueOnce(undefined);
    mockFinanceDeleteAll.mockResolvedValueOnce(undefined);

    mockTemplatesInsertMany.mockResolvedValueOnce(undefined);
    mockRotationsInsertMany.mockResolvedValueOnce(undefined);
    mockExceptionsInsertMany.mockResolvedValueOnce(undefined);
    mockShiftsInsertMany.mockResolvedValueOnce(undefined);
    mockSettingsUpdate.mockResolvedValueOnce(undefined);

    mockFinanceSavePayCycleProfile.mockResolvedValueOnce(undefined);
    mockFinanceInsertManyTemplates.mockResolvedValueOnce(undefined);
    mockFinanceInsertManyConfigs.mockResolvedValueOnce(undefined);
    mockFinanceInsertMonthlyEntries.mockResolvedValueOnce(undefined);

    // Mocks for re-initializing stores:
    mockTemplatesSeedIfEmpty.mockResolvedValueOnce(false);
    mockSettingsGetOrCreate.mockResolvedValueOnce(sampleSettings);
    mockTemplatesGetAll.mockResolvedValueOnce([sampleTemplate]);
    mockRotationsGetAll.mockResolvedValueOnce([]);
    mockFinanceGetPayCycleProfile.mockResolvedValueOnce(sampleProfile);
    mockFinanceGetTemplates.mockResolvedValueOnce([sampleFinanceTemplate]);

    const payload: BackupPayload = {
      version: 1,
      exportedAt: 1729759999000,
      settings: sampleSettings,
      templates: [sampleTemplate],
      rotations: [],
      exceptions: [],
      shifts: [],
      payCycleProfile: sampleProfile,
      financeTemplates: [sampleFinanceTemplate],
      monthlyConfigs: [sampleFinanceConfig],
      monthlyEntries: [sampleFinanceEntry],
    };

    await restoreDatabaseAndStores(payload);

    expect(mockFinanceDeleteAll).toHaveBeenCalled();
    expect(mockFinanceSavePayCycleProfile).toHaveBeenCalledWith(sampleProfile);
    expect(mockFinanceInsertManyTemplates).toHaveBeenCalledWith([sampleFinanceTemplate]);
    expect(mockFinanceInsertManyConfigs).toHaveBeenCalledWith([sampleFinanceConfig]);
    expect(mockFinanceInsertMonthlyEntries).toHaveBeenCalledWith([sampleFinanceEntry]);
  });
});

