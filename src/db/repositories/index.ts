import { db } from '../client';
import {
  createShiftTemplateRepository,
  mapRowToShiftTemplate,
} from './shiftTemplateRepository';
import {
  createRotationRepository,
  mapRowToRotation,
} from './rotationRepository';
import { createShiftRepository, mapRowToShift } from './shiftRepository';
import {
  createRotationExceptionRepository,
  mapRowToRotationException,
} from './rotationExceptionRepository';
import {
  createSettingsRepository,
  mapRowToSettings,
} from './settingsRepository';

export {
  createShiftTemplateRepository,
  mapRowToShiftTemplate,
  createRotationRepository,
  mapRowToRotation,
  createShiftRepository,
  mapRowToShift,
  createRotationExceptionRepository,
  mapRowToRotationException,
  createSettingsRepository,
  mapRowToSettings,
};

export const repositories = {
  templates: createShiftTemplateRepository(db),
  rotations: createRotationRepository(db),
  shifts: createShiftRepository(db),
  rotationExceptions: createRotationExceptionRepository(db),
  settings: createSettingsRepository(db),
} as const;
