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

export type ShiftSystemPresetId = '12h-healthcare' | '8h-three-shift' | '24h-duty';

export interface PresetRotationOption {
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly pattern: readonly (string | null)[];
  readonly isCustom?: boolean;
}

export interface ShiftSystemPreset {
  readonly id: ShiftSystemPresetId;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly templates: readonly ShiftTemplate[];
  readonly rotationOptions: readonly PresetRotationOption[];
}

export const ALL_STARTER_TEMPLATE_IDS: readonly string[] = [
  'default-day',
  'default-night',
  'default-off',
  'preset-8h-morning',
  'preset-8h-evening',
  'preset-8h-night',
  'preset-24h-duty',
];

export const SHIFT_SYSTEM_PRESETS: readonly ShiftSystemPreset[] = [
  {
    id: '12h-healthcare',
    title: '12-Hour Shifts',
    subtitle: 'Nurse / Healthcare',
    description: '12-hour alternating day and night shifts with dedicated rest days',
    templates: DEFAULT_SHIFT_TEMPLATES,
    rotationOptions: [
      {
        id: '4on-4off',
        label: '4 On / 4 Off',
        name: '4 On / 4 Off',
        pattern: [
          'default-day',
          'default-day',
          'default-day',
          'default-day',
          'default-off',
          'default-off',
          'default-off',
          'default-off',
        ],
      },
      {
        id: '2d-2n-4off',
        label: '2 Day / 2 Night / 4 Off',
        name: '2 Day / 2 Night / 4 Off',
        pattern: [
          'default-day',
          'default-day',
          'default-night',
          'default-night',
          'default-off',
          'default-off',
          'default-off',
          'default-off',
        ],
      },
      {
        id: 'custom',
        label: 'Custom in Rotation Wizard',
        name: 'Custom Rotation',
        pattern: [],
        isCustom: true,
      },
    ],
  },
  {
    id: '8h-three-shift',
    title: '8-Hour 3-Shift',
    subtitle: 'Morning / Evening / Night',
    description: '3-shift cycle covering morning, evening, and night work',
    templates: [
      {
        id: 'preset-8h-morning',
        name: 'Morning',
        icon: 'sunrise',
        color: getPresetLightColor('Amber'),
        startTime: '07:00',
        endTime: '15:00',
        breakMinutes: 0,
        hourlyRate: null,
        isOff: false,
        reminderOverride: null,
        archivedAt: null,
      },
      {
        id: 'preset-8h-evening',
        name: 'Evening',
        icon: 'sunset',
        color: getPresetLightColor('Orange'),
        startTime: '15:00',
        endTime: '23:00',
        breakMinutes: 0,
        hourlyRate: null,
        isOff: false,
        reminderOverride: null,
        archivedAt: null,
      },
      {
        id: 'preset-8h-night',
        name: 'Night',
        icon: 'moon',
        color: getPresetLightColor('Steel blue'),
        startTime: '23:00',
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
    ],
    rotationOptions: [
      {
        id: '2m-2e-2n-2off',
        label: '2M / 2E / 2N / 2 Off',
        name: '2 Morn / 2 Eve / 2 Night / 2 Off',
        pattern: [
          'preset-8h-morning',
          'preset-8h-morning',
          'preset-8h-evening',
          'preset-8h-evening',
          'preset-8h-night',
          'preset-8h-night',
          'default-off',
          'default-off',
        ],
      },
      {
        id: '5on-2off',
        label: '5 Morn / 2 Off',
        name: '5 Morning / 2 Off',
        pattern: [
          'preset-8h-morning',
          'preset-8h-morning',
          'preset-8h-morning',
          'preset-8h-morning',
          'preset-8h-morning',
          'default-off',
          'default-off',
        ],
      },
      {
        id: 'custom',
        label: 'Custom in Rotation Wizard',
        name: 'Custom Rotation',
        pattern: [],
        isCustom: true,
      },
    ],
  },
  {
    id: '24h-duty',
    title: '24-Hour Duty',
    subtitle: 'EMS / Duty',
    description: '24-hour on-duty shifts followed by 48 or 72 hours off',
    templates: [
      {
        id: 'preset-24h-duty',
        name: 'Duty 24h',
        icon: 'activity',
        color: getPresetLightColor('Red'),
        startTime: '08:00',
        endTime: '08:00',
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
    ],
    rotationOptions: [
      {
        id: '24on-48off',
        label: '24h On / 48h Off',
        name: '24h On / 48h Off',
        pattern: ['preset-24h-duty', 'default-off', 'default-off'],
      },
      {
        id: '24on-72off',
        label: '24h On / 72h Off',
        name: '24h On / 72h Off',
        pattern: ['preset-24h-duty', 'default-off', 'default-off', 'default-off'],
      },
      {
        id: 'custom',
        label: 'Custom in Rotation Wizard',
        name: 'Custom Rotation',
        pattern: [],
        isCustom: true,
      },
    ],
  },
];
