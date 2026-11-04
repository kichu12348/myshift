import { asc, desc, eq } from 'drizzle-orm';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_PAY_CYCLE_PROFILE,
  isFinanceRuleType,
  isFinanceValueMode,
  isPayCycleLengthUnit,
  type FinanceRepository,
  type FinanceTemplate,
  type MonthlyFinanceConfig,
  type MonthlyFinanceEntry,
  type PayCycleProfile,
} from '@/domain';
import { DataIntegrityError } from '../errors';
import type { AppDatabase } from '../client';
import {
  financeTemplates,
  monthlyFinanceConfigs,
  monthlyFinanceEntries,
  settings,
} from '../schema';
import { validateHexColor, validateNullableLocalDate } from './validation';

type FinanceTemplateRow = typeof financeTemplates.$inferSelect;
type MonthlyFinanceConfigRow = typeof monthlyFinanceConfigs.$inferSelect;
type MonthlyFinanceEntryRow = typeof monthlyFinanceEntries.$inferSelect;
type SettingsRow = typeof settings.$inferSelect;

const SETTINGS_ROW_ID = 1;

export function mapRowToPayCycleProfile(row: SettingsRow): PayCycleProfile {
  const table = 'settings';
  const rowId = String(row.id);

  if (!isPayCycleLengthUnit(row.payCycleLengthUnit)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Invalid payCycleLengthUnit: ${String(row.payCycleLengthUnit)}`,
    );
  }

  const paydayDayOfMonth = row.paydayDayOfMonth;
  if (paydayDayOfMonth < 1 || paydayDayOfMonth > 31) {
    throw new DataIntegrityError(
      table,
      rowId,
      `paydayDayOfMonth must be between 1 and 31, got ${paydayDayOfMonth}`,
    );
  }

  const cycleLengthDays = row.payCycleLengthDays;
  if (cycleLengthDays < 1) {
    throw new DataIntegrityError(
      table,
      rowId,
      `payCycleLengthDays must be at least 1, got ${cycleLengthDays}`,
    );
  }

  return {
    isConfigured: row.payCycleConfigured,
    paydayDayOfMonth,
    anchorPaydayDate: row.anchorPaydayDate,
    cycleLengthUnit: row.payCycleLengthUnit,
    cycleLengthDays,
  };
}

export function mapRowToFinanceTemplate(row: FinanceTemplateRow): FinanceTemplate {
  const table = 'finance_templates';
  const rowId = row.id;

  if (!isFinanceRuleType(row.category)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Invalid category in finance template: ${String(row.category)}`,
    );
  }

  if (!isFinanceValueMode(row.valueMode)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Invalid valueMode in finance template: ${String(row.valueMode)}`,
    );
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    valueMode: row.valueMode,
    value: row.value,
    icon: row.icon,
    color: validateHexColor(row.color, table, rowId),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export function mapRowToMonthlyFinanceConfig(row: MonthlyFinanceConfigRow): MonthlyFinanceConfig {
  const table = 'monthly_finance_configs';
  const rowId = row.monthKey;

  return {
    monthKey: row.monthKey,
    customStartDate: validateNullableLocalDate(row.customStartDate, table, rowId),
    customEndDate: validateNullableLocalDate(row.customEndDate, table, rowId),
    manualGrossOverride: row.manualGrossOverride,
    notes: row.notes,
  };
}

export function mapRowToMonthlyFinanceEntry(row: MonthlyFinanceEntryRow): MonthlyFinanceEntry {
  const table = 'monthly_finance_entries';
  const rowId = row.id;

  if (!isFinanceRuleType(row.category)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Invalid category in monthly finance entry: ${String(row.category)}`,
    );
  }

  if (!isFinanceValueMode(row.valueMode)) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Invalid valueMode in monthly finance entry: ${String(row.valueMode)}`,
    );
  }

  return {
    id: row.id,
    monthKey: row.monthKey,
    templateId: row.templateId,
    name: row.name,
    category: row.category,
    valueMode: row.valueMode,
    value: row.value,
    icon: row.icon,
    color: validateHexColor(row.color, table, rowId),
    sortOrder: row.sortOrder,
    isPaid: row.isPaid,
  };
}

export function createFinanceRepository(db: AppDatabase): FinanceRepository {
  return {
    async getPayCycleProfile(): Promise<PayCycleProfile> {
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ROW_ID))
        .limit(1);

      const existing = rows[0];
      if (existing === undefined) {
        return DEFAULT_PAY_CYCLE_PROFILE;
      }

      return mapRowToPayCycleProfile(existing);
    },

    async savePayCycleProfile(profile: PayCycleProfile): Promise<void> {
      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ROW_ID))
        .limit(1);

      if (existing[0] === undefined) {
        await db.insert(settings).values({
          id: SETTINGS_ROW_ID,
          remindersEnabled: DEFAULT_APP_SETTINGS.remindersEnabled,
          defaultMinutesBefore: [...DEFAULT_APP_SETTINGS.defaultMinutesBefore],
          themeMode: DEFAULT_APP_SETTINGS.themeMode,
          weekStart: DEFAULT_APP_SETTINGS.weekStart,
          timeFormat: DEFAULT_APP_SETTINGS.timeFormat,
          onboardingCompleted: DEFAULT_APP_SETTINGS.onboardingCompleted,
          hapticsEnabled: DEFAULT_APP_SETTINGS.hapticsEnabled,
          payCycleConfigured: profile.isConfigured,
          paydayDayOfMonth: profile.paydayDayOfMonth,
          anchorPaydayDate: profile.anchorPaydayDate,
          payCycleLengthUnit: profile.cycleLengthUnit,
          payCycleLengthDays: profile.cycleLengthDays,
        });
      } else {
        await db
          .update(settings)
          .set({
            payCycleConfigured: profile.isConfigured,
            paydayDayOfMonth: profile.paydayDayOfMonth,
            anchorPaydayDate: profile.anchorPaydayDate,
            payCycleLengthUnit: profile.cycleLengthUnit,
            payCycleLengthDays: profile.cycleLengthDays,
          })
          .where(eq(settings.id, SETTINGS_ROW_ID));
      }
    },

    async getMonthlyConfig(monthKey: string): Promise<MonthlyFinanceConfig | null> {
      const rows = await db
        .select()
        .from(monthlyFinanceConfigs)
        .where(eq(monthlyFinanceConfigs.monthKey, monthKey))
        .limit(1);

      const existing = rows[0];
      if (existing === undefined) {
        return null;
      }

      return mapRowToMonthlyFinanceConfig(existing);
    },

    async upsertMonthlyConfig(config: MonthlyFinanceConfig): Promise<void> {
      await db
        .insert(monthlyFinanceConfigs)
        .values({
          monthKey: config.monthKey,
          customStartDate: config.customStartDate,
          customEndDate: config.customEndDate,
          manualGrossOverride: config.manualGrossOverride,
          notes: config.notes,
        })
        .onConflictDoUpdate({
          target: monthlyFinanceConfigs.monthKey,
          set: {
            customStartDate: config.customStartDate,
            customEndDate: config.customEndDate,
            manualGrossOverride: config.manualGrossOverride,
            notes: config.notes,
          },
        });
    },

    async getMonthlyEntries(monthKey: string): Promise<MonthlyFinanceEntry[]> {
      const rows = await db
        .select()
        .from(monthlyFinanceEntries)
        .where(eq(monthlyFinanceEntries.monthKey, monthKey))
        .orderBy(asc(monthlyFinanceEntries.sortOrder));

      return rows.map(mapRowToMonthlyFinanceEntry);
    },

    async upsertMonthlyEntry(entry: MonthlyFinanceEntry): Promise<void> {
      await db
        .insert(monthlyFinanceEntries)
        .values({
          id: entry.id,
          monthKey: entry.monthKey,
          templateId: entry.templateId,
          name: entry.name,
          category: entry.category,
          valueMode: entry.valueMode,
          value: entry.value,
          icon: entry.icon,
          color: entry.color,
          sortOrder: entry.sortOrder,
          isPaid: entry.isPaid,
        })
        .onConflictDoUpdate({
          target: monthlyFinanceEntries.id,
          set: {
            monthKey: entry.monthKey,
            templateId: entry.templateId,
            name: entry.name,
            category: entry.category,
            valueMode: entry.valueMode,
            value: entry.value,
            icon: entry.icon,
            color: entry.color,
            sortOrder: entry.sortOrder,
            isPaid: entry.isPaid,
          },
        });
    },

    async deleteMonthlyEntry(id: string): Promise<void> {
      await db.delete(monthlyFinanceEntries).where(eq(monthlyFinanceEntries.id, id));
    },

    async setEntryPaid(id: string, isPaid: boolean): Promise<void> {
      await db
        .update(monthlyFinanceEntries)
        .set({ isPaid })
        .where(eq(monthlyFinanceEntries.id, id));
    },

    async insertMonthlyEntries(entries: ReadonlyArray<MonthlyFinanceEntry>): Promise<void> {
      if (entries.length === 0) {
        return;
      }

      await db.insert(monthlyFinanceEntries).values(
        entries.map((entry) => ({
          id: entry.id,
          monthKey: entry.monthKey,
          templateId: entry.templateId,
          name: entry.name,
          category: entry.category,
          valueMode: entry.valueMode,
          value: entry.value,
          icon: entry.icon,
          color: entry.color,
          sortOrder: entry.sortOrder,
          isPaid: entry.isPaid,
        })),
      );
    },

    async getTemplates(options?: {
      readonly includeInactive?: boolean;
    }): Promise<FinanceTemplate[]> {
      const query = db.select().from(financeTemplates).orderBy(asc(financeTemplates.sortOrder));

      const rows = await query;
      const filtered = options?.includeInactive ? rows : rows.filter((r) => r.isActive);

      return filtered.map(mapRowToFinanceTemplate);
    },

    async upsertTemplate(template: FinanceTemplate): Promise<void> {
      await db
        .insert(financeTemplates)
        .values({
          id: template.id,
          name: template.name,
          category: template.category,
          valueMode: template.valueMode,
          value: template.value,
          icon: template.icon,
          color: template.color,
          sortOrder: template.sortOrder,
          isActive: template.isActive,
        })
        .onConflictDoUpdate({
          target: financeTemplates.id,
          set: {
            name: template.name,
            category: template.category,
            valueMode: template.valueMode,
            value: template.value,
            icon: template.icon,
            color: template.color,
            sortOrder: template.sortOrder,
            isActive: template.isActive,
          },
        });
    },

    async deleteTemplate(id: string): Promise<void> {
      await db.delete(financeTemplates).where(eq(financeTemplates.id, id));
    },

    async getConfiguredMonths(): Promise<string[]> {
      const rows = await db
        .selectDistinct({ monthKey: monthlyFinanceEntries.monthKey })
        .from(monthlyFinanceEntries)
        .orderBy(desc(monthlyFinanceEntries.monthKey));
      return rows.map((r) => r.monthKey);
    },
  };
}
