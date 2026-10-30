import { create } from 'zustand';
import type { LocalDate, NewShift, Shift } from '@/domain';
import {
  getOffShiftTimes,
  getShiftTimes,
  isLocalDate,
  isTimeOfDay,
  normalizeOffsets,
  resolveConflictingShiftIds,
  timeOfDayToMinutes,
} from '@/domain';
import { repositories } from '@/db';
import { createId, createLogger, requestReminderSync } from '@/services';
import type { StoreStatus } from './types';

const logger = createLogger('store:shifts');
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export interface ShiftState {
  readonly shifts: Shift[];
  readonly range: { readonly from: LocalDate; readonly to: LocalDate } | null;
  readonly status: StoreStatus;
  readonly error: string | null;
  readonly loadRange: (from: LocalDate, to: LocalDate) => Promise<void>;
  readonly reloadRange: () => Promise<void>;
  readonly createShift: (input: NewShift) => Promise<Shift>;
  readonly updateShift: (id: string, input: NewShift) => Promise<void>;
  readonly deleteShift: (id: string) => Promise<void>;
}

function validateShiftInput(input: NewShift): void {
  const dateStr: string = input.date;
  if (!isLocalDate(dateStr)) {
    throw new Error(`Invalid shift date: ${dateStr}`);
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Shift name cannot be empty');
  }
  if (!HEX_COLOR_REGEX.test(input.color)) {
    throw new Error(`Invalid shift color: ${input.color}. Must be #RRGGBB format`);
  }
  const startTimeStr: string = input.startTime;
  if (!isTimeOfDay(startTimeStr)) {
    throw new Error(`Invalid shift start time: ${startTimeStr}`);
  }
  const endTimeStr: string = input.endTime;
  if (!isTimeOfDay(endTimeStr)) {
    throw new Error(`Invalid shift end time: ${endTimeStr}`);
  }
  if (
    typeof input.breakMinutes !== 'number' ||
    !Number.isInteger(input.breakMinutes) ||
    input.breakMinutes < 0
  ) {
    throw new Error('Shift breakMinutes must be a non-negative integer');
  }
  if (input.source !== 'manual' && input.source !== 'rotation_override') {
    throw new Error(`Invalid shift source: ${String(input.source)}`);
  }
}

let latestRangeRequestId = 0;

export const useShiftStore = create<ShiftState>()((set, get) => ({
  shifts: [],
  range: null,
  status: 'idle',
  error: null,

  async loadRange(from: LocalDate, to: LocalDate): Promise<void> {
    const requestId = ++latestRangeRequestId;

    if (!isLocalDate(from) || !isLocalDate(to)) {
      logger.error('Invalid date range for loadRange', { from, to });
      set({ status: 'error', error: 'Invalid date range' });
      return;
    }

    set({ status: 'loading', error: null });
    try {
      const loaded = await repositories.shifts.getByDateRange(from, to);
      if (requestId !== latestRangeRequestId) {
        return;
      }
      set({ shifts: loaded, range: { from, to }, status: 'ready', error: null });
    } catch (err: unknown) {
      if (requestId !== latestRangeRequestId) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to load shifts';
      logger.error('Failed to load shifts', err);
      set({ status: 'error', error: message });
    }
  },

  async reloadRange(): Promise<void> {
    const currentRange = get().range;
    if (currentRange === null) {
      return;
    }
    await get().loadRange(currentRange.from, currentRange.to);
  },

  async createShift(input: NewShift): Promise<Shift> {
    validateShiftInput(input);

    const dbShifts = await repositories.shifts.getByDateRange(input.date, input.date);
    const memoryShifts = get().shifts.filter((s) => s.date === input.date);
    const existingMap = new Map<string, Shift>();
    for (const s of memoryShifts) {
      existingMap.set(s.id, s);
    }
    for (const s of dbShifts) {
      existingMap.set(s.id, s);
    }
    const existingShifts = Array.from(existingMap.values());

    const startMinutes = timeOfDayToMinutes(input.startTime);
    const endMinutes = timeOfDayToMinutes(input.endTime);
    const conflictingIds = resolveConflictingShiftIds(existingShifts, {
      templateId: input.templateId,
      startMinutes,
      endMinutes,
      isOff: input.isOff,
    });

    for (const conflictId of conflictingIds) {
      await repositories.shifts.delete(conflictId);
    }

    const times = input.isOff
      ? getOffShiftTimes(input.date)
      : getShiftTimes(input.date, input.startTime, input.endTime);

    const now = Date.now();
    const shift: Shift = {
      id: createId(),
      date: input.date,
      templateId: input.templateId,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      isOff: input.isOff,
      startsAt: times.startsAt,
      endsAt: times.endsAt,
      breakMinutes: input.breakMinutes,
      notes: input.notes,
      source: input.source,
      rotationId: input.rotationId,
      reminderOverride:
        input.reminderOverride !== null ? normalizeOffsets(input.reminderOverride) : null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await repositories.shifts.insert(shift);
    } catch (err: unknown) {
      logger.error('Failed to insert shift', err);
      throw err;
    }

    if (get().range === null) {
      set((state) => ({
        shifts: [...state.shifts.filter((s) => !conflictingIds.includes(s.id)), shift],
      }));
    } else {
      await get().reloadRange();
    }
    void requestReminderSync();
    return shift;
  },

  async updateShift(id: string, input: NewShift): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Shift id is required');
    }
    validateShiftInput(input);

    const existing =
      get().shifts.find((s) => s.id === id) ?? (await repositories.shifts.getById(id));

    if (!existing) {
      throw new Error(`Shift not found with id: ${id}`);
    }

    const dbShifts = await repositories.shifts.getByDateRange(input.date, input.date);
    const memoryShifts = get().shifts.filter((s) => s.date === input.date);
    const existingMap = new Map<string, Shift>();
    for (const s of memoryShifts) {
      existingMap.set(s.id, s);
    }
    for (const s of dbShifts) {
      existingMap.set(s.id, s);
    }
    const existingShifts = Array.from(existingMap.values());

    const startMinutes = timeOfDayToMinutes(input.startTime);
    const endMinutes = timeOfDayToMinutes(input.endTime);
    const conflictingIds = resolveConflictingShiftIds(existingShifts, {
      templateId: input.templateId,
      startMinutes,
      endMinutes,
      isOff: input.isOff,
    }).filter((conflictId) => conflictId !== id);

    for (const conflictId of conflictingIds) {
      await repositories.shifts.delete(conflictId);
    }

    const times = input.isOff
      ? getOffShiftTimes(input.date)
      : getShiftTimes(input.date, input.startTime, input.endTime);

    const updated: Shift = {
      id,
      date: input.date,
      templateId: input.templateId,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      isOff: input.isOff,
      startsAt: times.startsAt,
      endsAt: times.endsAt,
      breakMinutes: input.breakMinutes,
      notes: input.notes,
      source: input.source,
      rotationId: input.rotationId,
      reminderOverride:
        input.reminderOverride !== null ? normalizeOffsets(input.reminderOverride) : null,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    try {
      await repositories.shifts.update(updated);
    } catch (err: unknown) {
      logger.error('Failed to update shift', err);
      throw err;
    }

    if (get().range === null) {
      set((state) => ({
        shifts: state.shifts
          .filter((s) => !conflictingIds.includes(s.id))
          .map((s) => (s.id === id ? updated : s)),
      }));
    } else {
      await get().reloadRange();
    }
    void requestReminderSync();
  },

  async deleteShift(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Shift id is required');
    }

    try {
      await repositories.shifts.delete(id);
    } catch (err: unknown) {
      logger.error('Failed to delete shift', err);
      throw err;
    }

    if (get().range === null) {
      set((state) => ({
        shifts: state.shifts.filter((s) => s.id !== id),
      }));
    } else {
      await get().reloadRange();
    }
    void requestReminderSync();
  },
}));

export const selectShifts = (state: ShiftState): Shift[] => state.shifts;
export const selectShiftRange = (
  state: ShiftState,
): { readonly from: LocalDate; readonly to: LocalDate } | null => state.range;
export const selectShiftStatus = (state: ShiftState): StoreStatus => state.status;
export const selectShiftError = (state: ShiftState): string | null => state.error;
