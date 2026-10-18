import type { ShiftTemplate } from '@/domain';
import { shiftColorPresets } from '@/theme';

function getPresetLightColor(name: string): string {
  const preset = shiftColorPresets.find((p) => p.name === name);
  if (preset === undefined) {
    throw new Error(`Color preset not found for name: ${name}`);
  }
  return preset.light;
}

/**
 * Default starter shift templates seeded when the database is empty.
 *
 * Templates store the preset's light hex; the UI will map a stored preset hex
 * to its dark variant in dark mode.
 */
export const DEFAULT_SHIFT_TEMPLATES: ReadonlyArray<ShiftTemplate> = [
  {
    id: 'default-day',
    name: 'Day',
    icon: 'sun',
    color: getPresetLightColor('Amber'),
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 0,
    hourlyRate: null,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  },
  {
    id: 'default-night',
    name: 'Night',
    icon: 'moon',
    color: getPresetLightColor('Steel blue'),
    startTime: '19:00',
    endTime: '07:00',
    breakMinutes: 0,
    hourlyRate: null,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  },
  {
    id: 'default-off',
    name: 'Off',
    icon: 'coffee',
    color: getPresetLightColor('Slate'),
    startTime: '00:00',
    endTime: '00:00',
    breakMinutes: 0,
    hourlyRate: null,
    isOff: true,
    reminderOverride: null,
    archivedAt: null,
  },
];
