import {
  addDays,
  computeDesiredReminders,
  getShiftTimes,
  resolveDay,
  rotationIndex,
  type Rotation,
  type ShiftTemplate,
} from '@/domain';

describe('domain/dates', () => {
  it('calculates overnight shift end date on the next calendar day', () => {
    const result = getShiftTimes('2026-10-24', '19:00', '07:00');
    expect(result.endDate).toBe('2026-10-25');
    expect(result.endsAt).toBeGreaterThan(result.startsAt);
  });

  it('adds days across month boundaries cleanly', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('domain/rotation', () => {
  it('handles dates before the anchor date using negative modulo', () => {
    expect(rotationIndex('2026-10-09', '2026-10-10', 4)).toBe(3);
  });
});

describe('domain/resolveDay & reminders', () => {
  const nightTemplate: ShiftTemplate = {
    id: 'tpl-night',
    name: 'Night',
    icon: 'moon',
    color: '#5B7DB1',
    startTime: '19:00',
    endTime: '07:00',
    breakMinutes: 30,
    hourlyRate: null,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  const rotation: Rotation = {
    id: 'rot-1',
    name: '2 On 2 Off',
    anchorDate: '2026-10-24',
    pattern: ['tpl-night', 'tpl-night', null, null],
    startDate: '2026-10-01',
    endDate: null,
    active: true,
  };

  it('resolves virtual rotation shifts and computes desired reminders', () => {
    const templatesById = new Map<string, ShiftTemplate>([[nightTemplate.id, nightTemplate]]);

    const resolved = resolveDay('2026-10-24', {
      rotations: [rotation],
      exceptions: [],
      manualShifts: [],
      templatesById,
    });

    expect(resolved.shifts).toHaveLength(1);
    const firstShift = resolved.shifts[0];
    expect(firstShift?.origin).toBe('rotation');

    const now = (firstShift?.startsAt ?? 0) - 120 * 60_000;
    const reminders = computeDesiredReminders({
      shifts: resolved.shifts,
      templatesById,
      preferences: { enabled: true, minutesBefore: [60, 30, 15] },
      now,
      maxReminders: 60,
    });

    expect(reminders).toHaveLength(3);
    expect(reminders.map((r) => r.offsetMinutes)).toEqual([60, 30, 15]);
  });
});
