import { create } from 'zustand';
import {
  ALL_STARTER_TEMPLATE_IDS,
  SHIFT_SYSTEM_PRESETS,
  type ShiftSystemPresetId,
} from '@/constants';
import type { NewShiftTemplate, ShiftTemplate } from '@/domain';
import { isTimeOfDay, normalizeOffsets } from '@/domain';
import { repositories } from '@/db';
import { createId, createLogger, requestReminderSync } from '@/services';
import type { StoreStatus } from './types';

const logger = createLogger('store:templates');
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export interface TemplateState {
  readonly templates: ShiftTemplate[];
  readonly status: StoreStatus;
  readonly error: string | null;
  readonly loadTemplates: () => Promise<void>;
  readonly createTemplate: (input: NewShiftTemplate) => Promise<ShiftTemplate>;
  readonly updateTemplate: (template: ShiftTemplate) => Promise<void>;
  readonly archiveTemplate: (id: string) => Promise<void>;
  readonly unarchiveTemplate: (id: string) => Promise<void>;
  readonly applyTemplatePreset: (presetId: ShiftSystemPresetId) => Promise<void>;
}

function validateTemplateInput(
  name: string,
  color: string,
  startTime: string,
  endTime: string,
  breakMinutes: number,
  hourlyRate: number | null,
): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Template name cannot be empty');
  }
  if (!HEX_COLOR_REGEX.test(color)) {
    throw new Error(`Invalid template color: ${color}. Must be #RRGGBB format`);
  }
  if (!isTimeOfDay(startTime)) {
    throw new Error(`Invalid template start time: ${startTime}`);
  }
  if (!isTimeOfDay(endTime)) {
    throw new Error(`Invalid template end time: ${endTime}`);
  }
  if (typeof breakMinutes !== 'number' || !Number.isInteger(breakMinutes) || breakMinutes < 0) {
    throw new Error('Template breakMinutes must be a non-negative integer');
  }
  if (
    hourlyRate !== null &&
    (typeof hourlyRate !== 'number' || hourlyRate < 0 || !Number.isFinite(hourlyRate))
  ) {
    throw new Error('Template hourlyRate must be null or a positive number');
  }
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  templates: [],
  status: 'idle',
  error: null,

  async loadTemplates(): Promise<void> {
    set({ status: 'loading', error: null });
    try {
      const allTemplates = await repositories.templates.getAll({ includeArchived: true });
      set({ templates: allTemplates, status: 'ready', error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load shift templates';
      logger.error('Failed to load templates', err);
      set({ status: 'error', error: message });
    }
  },

  async createTemplate(input: NewShiftTemplate): Promise<ShiftTemplate> {
    validateTemplateInput(
      input.name,
      input.color,
      input.startTime,
      input.endTime,
      input.breakMinutes,
      input.hourlyRate,
    );

    const template: ShiftTemplate = {
      id: createId(),
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      startTime: input.startTime,
      endTime: input.endTime,
      breakMinutes: input.breakMinutes,
      hourlyRate: input.hourlyRate,
      isOff: input.isOff,
      reminderOverride:
        input.reminderOverride !== null ? normalizeOffsets(input.reminderOverride) : null,
      archivedAt: null,
    };

    try {
      await repositories.templates.insert(template);
    } catch (err: unknown) {
      logger.error('Failed to insert shift template', err);
      throw err;
    }

    const reloaded = await repositories.templates.getAll({ includeArchived: true });
    set({ templates: reloaded, status: 'ready', error: null });
    void requestReminderSync();
    return template;
  },

  async updateTemplate(template: ShiftTemplate): Promise<void> {
    if (!template.id || template.id.trim().length === 0) {
      throw new Error('Template id is required');
    }
    validateTemplateInput(
      template.name,
      template.color,
      template.startTime,
      template.endTime,
      template.breakMinutes,
      template.hourlyRate,
    );

    const normalizedTemplate: ShiftTemplate = {
      ...template,
      name: template.name.trim(),
      reminderOverride:
        template.reminderOverride !== null ? normalizeOffsets(template.reminderOverride) : null,
    };

    try {
      await repositories.templates.update(normalizedTemplate);
    } catch (err: unknown) {
      logger.error('Failed to update shift template', err);
      throw err;
    }

    const reloaded = await repositories.templates.getAll({ includeArchived: true });
    set({ templates: reloaded, status: 'ready', error: null });
    void requestReminderSync();
  },

  async archiveTemplate(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Template id is required');
    }
    try {
      await repositories.templates.setArchived(id, Date.now());
    } catch (err: unknown) {
      logger.error('Failed to archive shift template', err);
      throw err;
    }

    const reloaded = await repositories.templates.getAll({ includeArchived: true });
    set({ templates: reloaded, status: 'ready', error: null });
    void requestReminderSync();
  },

  async unarchiveTemplate(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Template id is required');
    }
    try {
      await repositories.templates.setArchived(id, null);
    } catch (err: unknown) {
      logger.error('Failed to unarchive shift template', err);
      throw err;
    }

    const reloaded = await repositories.templates.getAll({ includeArchived: true });
    set({ templates: reloaded, status: 'ready', error: null });
    void requestReminderSync();
  },

  async applyTemplatePreset(presetId: ShiftSystemPresetId): Promise<void> {
    const preset = SHIFT_SYSTEM_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`Unknown shift system preset: ${String(presetId)}`);
    }

    set({ status: 'loading', error: null });
    try {
      const allExisting = await repositories.templates.getAll({ includeArchived: true });
      const existingById = new Map<string, ShiftTemplate>(allExisting.map((t) => [t.id, t]));
      const targetPresetIds = new Set(preset.templates.map((t) => t.id));

      // 1. Ensure all templates in the selected preset exist and are active (unarchived)
      for (const t of preset.templates) {
        const existing = existingById.get(t.id);
        if (existing !== undefined) {
          if (existing.archivedAt !== null) {
            await repositories.templates.setArchived(t.id, null);
          }
        } else {
          await repositories.templates.insert(t);
        }
      }

      // 2. Archive starter templates from other presets that are not in the selected preset
      for (const starterId of ALL_STARTER_TEMPLATE_IDS) {
        if (!targetPresetIds.has(starterId)) {
          const existing = existingById.get(starterId);
          if (existing !== undefined && existing.archivedAt === null) {
            await repositories.templates.setArchived(starterId, Date.now());
          }
        }
      }

      const reloaded = await repositories.templates.getAll({ includeArchived: true });
      set({ templates: reloaded, status: 'ready', error: null });
      void requestReminderSync();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply shift template preset';
      logger.error('Failed to apply shift template preset', err);
      set({ status: 'error', error: message });
      throw err;
    }
  },
}));

export const selectTemplates = (state: TemplateState): ShiftTemplate[] => state.templates;
export const selectTemplatesStatus = (state: TemplateState): StoreStatus => state.status;
export const selectTemplatesError = (state: TemplateState): string | null => state.error;
