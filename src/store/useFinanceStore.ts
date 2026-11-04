import { create } from 'zustand';
import {
  DEFAULT_FINANCE_TEMPLATES,
  DEFAULT_PAY_CYCLE_PROFILE,
  cloneMonthFinanceStructure,
  compareLocalDates,
  isFinanceRuleType,
  isFinanceValueMode,
  isLocalDate,
  populateMonthFromTemplates,
  type FinanceTemplate,
  type MonthlyFinanceConfig,
  type MonthlyFinanceEntry,
  type PayCycleProfile,
} from '@/domain';
import { repositories } from '@/db';
import { createId, createLogger } from '@/services';
import type { StoreStatus } from './types';

const logger = createLogger('store:finance');

export interface FinanceState {
  readonly payCycleProfile: PayCycleProfile;
  readonly templates: FinanceTemplate[];
  readonly monthlyConfigs: Record<string, MonthlyFinanceConfig>;
  readonly monthlyEntries: Record<string, MonthlyFinanceEntry[]>;
  readonly status: StoreStatus;
  readonly error: string | null;

  readonly loadPayCycleProfile: () => Promise<void>;
  readonly loadTemplates: (includeInactive?: boolean) => Promise<void>;
  readonly loadMonthData: (monthKey: string) => Promise<void>;
  readonly savePayCycleProfile: (profile: PayCycleProfile) => Promise<void>;
  readonly setMonthDateRangeOverride: (
    monthKey: string,
    startDate: string | null,
    endDate: string | null,
  ) => Promise<void>;
  readonly setManualGrossOverride: (monthKey: string, amount: number | null) => Promise<void>;
  readonly upsertMonthlyEntry: (monthKey: string, entry: MonthlyFinanceEntry) => Promise<void>;
  readonly deleteMonthlyEntry: (monthKey: string, id: string) => Promise<void>;
  readonly toggleEntryPaid: (monthKey: string, id: string) => Promise<void>;
  readonly upsertFinanceTemplate: (template: FinanceTemplate) => Promise<void>;
  readonly deleteFinanceTemplate: (id: string) => Promise<void>;
  readonly copyStructureFromMonth: (
    sourceMonthKey: string,
    targetMonthKey: string,
  ) => Promise<void>;
  readonly resetMonthToDefaultTemplates: (monthKey: string) => Promise<void>;
  readonly getConfiguredMonths: () => Promise<string[]>;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  payCycleProfile: DEFAULT_PAY_CYCLE_PROFILE,
  templates: [],
  monthlyConfigs: {},
  monthlyEntries: {},
  status: 'idle',
  error: null,

  async loadPayCycleProfile(): Promise<void> {
    set({ status: 'loading', error: null });
    try {
      const profile = await repositories.finance.getPayCycleProfile();
      set({ payCycleProfile: profile, status: 'ready', error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load pay cycle profile';
      logger.error('Failed to load pay cycle profile', err);
      set({ status: 'error', error: message });
    }
  },

  async loadTemplates(includeInactive?: boolean): Promise<void> {
    try {
      const templates = await repositories.finance.getTemplates(
        includeInactive !== undefined ? { includeInactive } : undefined,
      );
      set({ templates });
    } catch (err: unknown) {
      logger.error('Failed to load finance templates', err);
      throw err;
    }
  },

  async loadMonthData(monthKey: string): Promise<void> {
    try {
      const [config, entries] = await Promise.all([
        repositories.finance.getMonthlyConfig(monthKey),
        repositories.finance.getMonthlyEntries(monthKey),
      ]);

      set((state) => {
        const nextConfigs = { ...state.monthlyConfigs };
        if (config !== null) {
          nextConfigs[monthKey] = config;
        }
        return {
          monthlyConfigs: nextConfigs,
          monthlyEntries: {
            ...state.monthlyEntries,
            [monthKey]: entries,
          },
        };
      });
    } catch (err: unknown) {
      logger.error(`Failed to load finance data for ${monthKey}`, err);
      throw err;
    }
  },

  async savePayCycleProfile(profile: PayCycleProfile): Promise<void> {
    if (profile.paydayDayOfMonth < 1 || profile.paydayDayOfMonth > 31) {
      throw new Error(`paydayDayOfMonth must be between 1 and 31, got ${profile.paydayDayOfMonth}`);
    }
    if (profile.cycleLengthDays < 1) {
      throw new Error(`cycleLengthDays must be at least 1, got ${profile.cycleLengthDays}`);
    }

    try {
      await repositories.finance.savePayCycleProfile(profile);
      set({ payCycleProfile: profile });
    } catch (err: unknown) {
      logger.error('Failed to save pay cycle profile', err);
      throw err;
    }
  },

  async setMonthDateRangeOverride(
    monthKey: string,
    startDate: string | null,
    endDate: string | null,
  ): Promise<void> {
    if (startDate !== null && !isLocalDate(startDate)) {
      throw new Error(`Invalid customStartDate: ${startDate}`);
    }
    if (endDate !== null && !isLocalDate(endDate)) {
      throw new Error(`Invalid customEndDate: ${endDate}`);
    }
    if (startDate !== null && endDate !== null && compareLocalDates(startDate, endDate) > 0) {
      throw new Error(`customStartDate (${startDate}) cannot be after customEndDate (${endDate})`);
    }

    const current = get().monthlyConfigs[monthKey] ?? {
      monthKey,
      customStartDate: null,
      customEndDate: null,
      manualGrossOverride: null,
      notes: '',
    };

    const updated: MonthlyFinanceConfig = {
      ...current,
      customStartDate: startDate,
      customEndDate: endDate,
    };

    try {
      await repositories.finance.upsertMonthlyConfig(updated);
      set((state) => ({
        monthlyConfigs: {
          ...state.monthlyConfigs,
          [monthKey]: updated,
        },
      }));
    } catch (err: unknown) {
      logger.error(`Failed to update month date range for ${monthKey}`, err);
      throw err;
    }
  },

  async setManualGrossOverride(monthKey: string, amount: number | null): Promise<void> {
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      throw new Error('manualGrossOverride must be null or a non-negative number');
    }

    const current = get().monthlyConfigs[monthKey] ?? {
      monthKey,
      customStartDate: null,
      customEndDate: null,
      manualGrossOverride: null,
      notes: '',
    };

    const updated: MonthlyFinanceConfig = {
      ...current,
      manualGrossOverride: amount !== null ? Math.round(amount * 100) / 100 : null,
    };

    try {
      await repositories.finance.upsertMonthlyConfig(updated);
      set((state) => ({
        monthlyConfigs: {
          ...state.monthlyConfigs,
          [monthKey]: updated,
        },
      }));
    } catch (err: unknown) {
      logger.error(`Failed to update manual gross override for ${monthKey}`, err);
      throw err;
    }
  },

  async upsertMonthlyEntry(monthKey: string, entry: MonthlyFinanceEntry): Promise<void> {
    if (!entry.name || entry.name.trim().length === 0) {
      throw new Error('Monthly finance entry name cannot be empty');
    }
    if (!Number.isFinite(entry.value) || entry.value < 0) {
      throw new Error('Monthly finance entry value must be a non-negative number');
    }
    if (!isFinanceRuleType(entry.category)) {
      throw new Error(`Invalid finance rule category: ${String(entry.category)}`);
    }
    if (!isFinanceValueMode(entry.valueMode)) {
      throw new Error(`Invalid finance value mode: ${String(entry.valueMode)}`);
    }

    const normalizedEntry: MonthlyFinanceEntry = {
      ...entry,
      monthKey,
      name: entry.name.trim(),
    };

    try {
      await repositories.finance.upsertMonthlyEntry(normalizedEntry);
      set((state) => {
        const currentList = state.monthlyEntries[monthKey] ?? [];
        const index = currentList.findIndex((item) => item.id === normalizedEntry.id);
        const updatedList =
          index >= 0
            ? currentList.map((item) => (item.id === normalizedEntry.id ? normalizedEntry : item))
            : [...currentList, normalizedEntry];

        updatedList.sort((a, b) => a.sortOrder - b.sortOrder);

        return {
          monthlyEntries: {
            ...state.monthlyEntries,
            [monthKey]: updatedList,
          },
        };
      });
    } catch (err: unknown) {
      logger.error(`Failed to upsert monthly entry ${entry.id}`, err);
      throw err;
    }
  },

  async deleteMonthlyEntry(monthKey: string, id: string): Promise<void> {
    try {
      await repositories.finance.deleteMonthlyEntry(id);
      set((state) => {
        const currentList = state.monthlyEntries[monthKey] ?? [];
        return {
          monthlyEntries: {
            ...state.monthlyEntries,
            [monthKey]: currentList.filter((item) => item.id !== id),
          },
        };
      });
    } catch (err: unknown) {
      logger.error(`Failed to delete monthly entry ${id}`, err);
      throw err;
    }
  },

  async toggleEntryPaid(monthKey: string, id: string): Promise<void> {
    const currentList = get().monthlyEntries[monthKey] ?? [];
    const target = currentList.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const nextPaid = !target.isPaid;
    try {
      await repositories.finance.setEntryPaid(id, nextPaid);
      set((state) => {
        const list = state.monthlyEntries[monthKey] ?? [];
        return {
          monthlyEntries: {
            ...state.monthlyEntries,
            [monthKey]: list.map((item) => (item.id === id ? { ...item, isPaid: nextPaid } : item)),
          },
        };
      });
    } catch (err: unknown) {
      logger.error(`Failed to toggle paid status for entry ${id}`, err);
      throw err;
    }
  },

  async upsertFinanceTemplate(template: FinanceTemplate): Promise<void> {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Finance template name cannot be empty');
    }
    if (!Number.isFinite(template.value) || template.value < 0) {
      throw new Error('Finance template value must be a non-negative number');
    }
    if (!isFinanceRuleType(template.category)) {
      throw new Error(`Invalid finance rule category: ${String(template.category)}`);
    }
    if (!isFinanceValueMode(template.valueMode)) {
      throw new Error(`Invalid finance value mode: ${String(template.valueMode)}`);
    }

    const normalizedTemplate: FinanceTemplate = {
      ...template,
      name: template.name.trim(),
    };

    try {
      await repositories.finance.upsertTemplate(normalizedTemplate);
      set((state) => {
        const index = state.templates.findIndex((item) => item.id === normalizedTemplate.id);
        const updatedList =
          index >= 0
            ? state.templates.map((item) =>
                item.id === normalizedTemplate.id ? normalizedTemplate : item,
              )
            : [...state.templates, normalizedTemplate];

        updatedList.sort((a, b) => a.sortOrder - b.sortOrder);
        return { templates: updatedList };
      });
    } catch (err: unknown) {
      logger.error(`Failed to upsert finance template ${template.id}`, err);
      throw err;
    }
  },

  async deleteFinanceTemplate(id: string): Promise<void> {
    try {
      await repositories.finance.deleteTemplate(id);
      set((state) => ({
        templates: state.templates.filter((item) => item.id !== id),
      }));
    } catch (err: unknown) {
      logger.error(`Failed to delete finance template ${id}`, err);
      throw err;
    }
  },

  async copyStructureFromMonth(sourceMonthKey: string, targetMonthKey: string): Promise<void> {
    try {
      let sourceEntries = get().monthlyEntries[sourceMonthKey];
      if (sourceEntries === undefined) {
        sourceEntries = await repositories.finance.getMonthlyEntries(sourceMonthKey);
      }

      const { entries: clonedEntries, config: clonedConfig } = cloneMonthFinanceStructure(
        sourceEntries,
        targetMonthKey,
        createId,
      );

      await repositories.finance.upsertMonthlyConfig(clonedConfig);
      await repositories.finance.insertMonthlyEntries(clonedEntries);

      set((state) => ({
        monthlyConfigs: {
          ...state.monthlyConfigs,
          [targetMonthKey]: clonedConfig,
        },
        monthlyEntries: {
          ...state.monthlyEntries,
          [targetMonthKey]: clonedEntries,
        },
      }));
    } catch (err: unknown) {
      logger.error(
        `Failed to copy finance structure from ${sourceMonthKey} to ${targetMonthKey}`,
        err,
      );
      throw err;
    }
  },

  async resetMonthToDefaultTemplates(monthKey: string): Promise<void> {
    try {
      let templates = get().templates;
      if (templates.length === 0) {
        templates = await repositories.finance.getTemplates();
      }
      const templateList: FinanceTemplate[] =
        templates.length > 0
          ? templates
          : DEFAULT_FINANCE_TEMPLATES.map((t: Omit<FinanceTemplate, 'id'>, idx: number) => ({
              ...t,
              id: `default-tpl-${idx + 1}`,
            }));

      const entries = populateMonthFromTemplates(templateList, monthKey, createId);
      await repositories.finance.insertMonthlyEntries(entries);

      set((state) => ({
        monthlyEntries: {
          ...state.monthlyEntries,
          [monthKey]: entries,
        },
      }));
    } catch (err: unknown) {
      logger.error(`Failed to reset month ${monthKey} to default templates`, err);
      throw err;
    }
  },

  async getConfiguredMonths(): Promise<string[]> {
    try {
      return await repositories.finance.getConfiguredMonths();
    } catch (err: unknown) {
      logger.error('Failed to get configured months', err);
      return Object.keys(get().monthlyEntries);
    }
  },
}));

export const selectPayCycleProfile = (state: FinanceState): PayCycleProfile =>
  state.payCycleProfile;

export const selectFinanceTemplates = (state: FinanceState): FinanceTemplate[] => state.templates;

export const selectMonthlyConfig =
  (monthKey: string) =>
  (state: FinanceState): MonthlyFinanceConfig | undefined =>
    state.monthlyConfigs[monthKey];

export const selectMonthlyEntries =
  (monthKey: string) =>
  (state: FinanceState): MonthlyFinanceEntry[] =>
    state.monthlyEntries[monthKey] ?? [];

export const selectFinanceStatus = (state: FinanceState): StoreStatus => state.status;

export const selectFinanceError = (state: FinanceState): string | null => state.error;
