import { create } from 'zustand';
import type {
  LocalDate,
  NewRotation,
  Rotation,
  RotationException,
  RotationPatternEntry,
} from '@/domain';
import { compareLocalDates, isLocalDate } from '@/domain';
import { repositories } from '@/db';
import { createId, createLogger } from '@/services';
import type { StoreStatus } from './types';

const logger = createLogger('store:rotations');

export interface RotationState {
  readonly rotations: Rotation[];
  readonly exceptions: RotationException[];
  readonly exceptionsRange: { readonly from: LocalDate; readonly to: LocalDate } | null;
  readonly status: StoreStatus;
  readonly error: string | null;
  readonly loadRotations: () => Promise<void>;
  readonly loadExceptions: (from: LocalDate, to: LocalDate) => Promise<void>;
  readonly reloadExceptions: () => Promise<void>;
  readonly createRotation: (input: NewRotation) => Promise<Rotation>;
  readonly updateRotation: (rotation: Rotation) => Promise<void>;
  readonly deleteRotation: (id: string) => Promise<void>;
  readonly upsertException: (exception: RotationException) => Promise<void>;
  readonly deleteException: (rotationId: string, date: LocalDate) => Promise<void>;
}

function validateRotationInput(
  name: string,
  pattern: readonly RotationPatternEntry[],
  anchorDate: LocalDate,
  startDate: LocalDate,
  endDate: LocalDate | null,
): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Rotation name cannot be empty');
  }
  if (!pattern || pattern.length === 0) {
    throw new Error('Rotation pattern must not be empty');
  }
  if (!isLocalDate(anchorDate)) {
    throw new Error(`Invalid rotation anchorDate: ${String(anchorDate)}`);
  }
  if (!isLocalDate(startDate)) {
    throw new Error(`Invalid rotation startDate: ${String(startDate)}`);
  }
  if (endDate !== null) {
    if (!isLocalDate(endDate)) {
      throw new Error(`Invalid rotation endDate: ${String(endDate)}`);
    }
    if (compareLocalDates(endDate, startDate) < 0) {
      throw new Error('Rotation endDate cannot be before startDate');
    }
  }
}

let latestExceptionsRequestId = 0;

export const useRotationStore = create<RotationState>()((set, get) => ({
  rotations: [],
  exceptions: [],
  exceptionsRange: null,
  status: 'idle',
  error: null,

  async loadRotations(): Promise<void> {
    set({ status: 'loading', error: null });
    try {
      const loaded = await repositories.rotations.getAll();
      set({ rotations: loaded, status: 'ready', error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load rotations';
      logger.error('Failed to load rotations', err);
      set({ status: 'error', error: message });
    }
  },

  async loadExceptions(from: LocalDate, to: LocalDate): Promise<void> {
    const requestId = ++latestExceptionsRequestId;

    if (!isLocalDate(from) || !isLocalDate(to)) {
      logger.error('Invalid date range for loadExceptions', { from, to });
      set({ status: 'error', error: 'Invalid date range' });
      return;
    }

    set({ status: 'loading', error: null });
    try {
      const loaded = await repositories.rotationExceptions.getByDateRange(from, to);
      if (requestId !== latestExceptionsRequestId) {
        return;
      }
      set({ exceptions: loaded, exceptionsRange: { from, to }, status: 'ready', error: null });
    } catch (err: unknown) {
      if (requestId !== latestExceptionsRequestId) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to load rotation exceptions';
      logger.error('Failed to load rotation exceptions', err);
      set({ status: 'error', error: message });
    }
  },

  async reloadExceptions(): Promise<void> {
    const currentRange = get().exceptionsRange;
    if (currentRange === null) {
      return;
    }
    await get().loadExceptions(currentRange.from, currentRange.to);
  },

  async createRotation(input: NewRotation): Promise<Rotation> {
    validateRotationInput(
      input.name,
      input.pattern,
      input.anchorDate,
      input.startDate,
      input.endDate,
    );

    const rotation: Rotation = {
      id: createId(),
      name: input.name.trim(),
      anchorDate: input.anchorDate,
      pattern: [...input.pattern],
      startDate: input.startDate,
      endDate: input.endDate,
      active: input.active,
    };

    try {
      await repositories.rotations.insert(rotation);
    } catch (err: unknown) {
      logger.error('Failed to insert rotation', err);
      throw err;
    }

    await get().loadRotations();
    await get().reloadExceptions();
    return rotation;
  },

  async updateRotation(rotation: Rotation): Promise<void> {
    if (!rotation.id || rotation.id.trim().length === 0) {
      throw new Error('Rotation id is required');
    }
    validateRotationInput(
      rotation.name,
      rotation.pattern,
      rotation.anchorDate,
      rotation.startDate,
      rotation.endDate,
    );

    const normalized: Rotation = {
      ...rotation,
      name: rotation.name.trim(),
      pattern: [...rotation.pattern],
    };

    try {
      await repositories.rotations.update(normalized);
    } catch (err: unknown) {
      logger.error('Failed to update rotation', err);
      throw err;
    }

    await get().loadRotations();
    await get().reloadExceptions();
  },

  async deleteRotation(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Rotation id is required');
    }

    try {
      await repositories.rotations.delete(id);
    } catch (err: unknown) {
      logger.error('Failed to delete rotation', err);
      throw err;
    }

    await get().loadRotations();
    await get().reloadExceptions();
  },

  async upsertException(exception: RotationException): Promise<void> {
    if (!exception.rotationId || exception.rotationId.trim().length === 0) {
      throw new Error('Rotation id is required');
    }
    if (!isLocalDate(exception.date)) {
      throw new Error(`Invalid exception date: ${String(exception.date)}`);
    }
    if (exception.kind !== 'skip' && exception.kind !== 'replace') {
      throw new Error(`Invalid exception kind: ${String(exception.kind)}`);
    }
    if (exception.kind === 'replace' && (!exception.templateId || exception.templateId.trim().length === 0)) {
      throw new Error('Template id is required for replace exception');
    }
    if (exception.kind === 'skip' && exception.templateId !== null) {
      throw new Error('Template id must be null for skip exception');
    }

    try {
      await repositories.rotationExceptions.upsert(exception);
    } catch (err: unknown) {
      logger.error('Failed to upsert rotation exception', err);
      throw err;
    }

    await get().reloadExceptions();
  },

  async deleteException(rotationId: string, date: LocalDate): Promise<void> {
    if (!rotationId || rotationId.trim().length === 0) {
      throw new Error('Rotation id is required');
    }
    if (!isLocalDate(date)) {
      throw new Error(`Invalid exception date: ${String(date)}`);
    }

    try {
      await repositories.rotationExceptions.delete(rotationId, date);
    } catch (err: unknown) {
      logger.error('Failed to delete rotation exception', err);
      throw err;
    }

    await get().reloadExceptions();
  },
}));

export const selectRotations = (state: RotationState): Rotation[] => state.rotations;
export const selectExceptions = (state: RotationState): RotationException[] => state.exceptions;
export const selectExceptionsRange = (
  state: RotationState,
): { readonly from: LocalDate; readonly to: LocalDate } | null => state.exceptionsRange;
export const selectRotationStatus = (state: RotationState): StoreStatus => state.status;
export const selectRotationError = (state: RotationState): string | null => state.error;
