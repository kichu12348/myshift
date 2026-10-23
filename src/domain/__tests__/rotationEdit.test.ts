import {
  planRotationEdit,
  resolveRange,
  type NewRotation,
  type Rotation,
  type ShiftTemplate,
} from '../index';

describe('planRotationEdit', () => {
  const existingRotation: Rotation = {
    id: 'rot-1',
    name: 'Day/Night 4-on-4-off',
    anchorDate: '2026-01-01',
    pattern: ['tpl-day', 'tpl-day', 'tpl-night', 'tpl-night', 'tpl-off', 'tpl-off', 'tpl-off', 'tpl-off'],
    startDate: '2026-01-01',
    endDate: null,
    active: true,
  };

  const updatedInput: NewRotation = {
    name: 'Straight Days 4-on-4-off',
    anchorDate: '2026-06-01',
    pattern: ['tpl-day', 'tpl-day', 'tpl-day', 'tpl-day', 'tpl-off', 'tpl-off', 'tpl-off', 'tpl-off'],
    startDate: '2026-06-01',
    endDate: null,
    active: true,
  };

  it('returns update_in_place when effectiveFrom is on or before existing startDate', () => {
    const plan = planRotationEdit(existingRotation, updatedInput, '2026-01-01');

    expect(plan.kind).toBe('update_in_place');
    if (plan.kind === 'update_in_place') {
      expect(plan.rotation.id).toBe('rot-1');
      expect(plan.rotation.name).toBe('Straight Days 4-on-4-off');
      expect(plan.rotation.anchorDate).toBe('2026-06-01');
      expect(plan.rotation.pattern).toEqual(updatedInput.pattern);
      expect(plan.rotation.startDate).toBe('2026-06-01');
      expect(plan.rotation.endDate).toBeNull();
    }

    const planBefore = planRotationEdit(existingRotation, updatedInput, '2025-12-15');
    expect(planBefore.kind).toBe('update_in_place');
  });

  it('returns split when effectiveFrom is after existing startDate, freezing past dates', () => {
    const plan = planRotationEdit(existingRotation, updatedInput, '2026-06-01');

    expect(plan.kind).toBe('split');
    if (plan.kind === 'split') {
      // Closed rotation freezes on 2026-05-31
      expect(plan.closedRotation.id).toBe('rot-1');
      expect(plan.closedRotation.name).toBe('Day/Night 4-on-4-off');
      expect(plan.closedRotation.endDate).toBe('2026-05-31');
      expect(plan.closedRotation.pattern).toEqual(existingRotation.pattern);

      // New rotation starts from 2026-06-01
      expect(plan.newRotation.name).toBe('Straight Days 4-on-4-off');
      expect(plan.newRotation.startDate).toBe('2026-06-01');
      expect(plan.newRotation.anchorDate).toBe('2026-06-01');
      expect(plan.newRotation.pattern).toEqual(updatedInput.pattern);
      expect(plan.newRotation.active).toBe(true);
      expect(plan.newRotation.endDate).toBeNull();
    }
  });

  it('preserves an earlier existing endDate if closedRotation endDate was already before effectiveFrom - 1', () => {
    const limitedRotation: Rotation = {
      ...existingRotation,
      endDate: '2026-05-20',
    };

    const plan = planRotationEdit(limitedRotation, updatedInput, '2026-06-01');

    expect(plan.kind).toBe('split');
    if (plan.kind === 'split') {
      expect(plan.closedRotation.endDate).toBe('2026-05-20');
    }
  });

  it('demonstrates non-destructive behavior with resolveRange across split boundary', () => {
    const templates: ShiftTemplate[] = [
      {
        id: 'tpl-day',
        name: 'Day',
        icon: 'sun',
        color: '#F59E0B',
        startTime: '07:00',
        endTime: '15:00',
        breakMinutes: 30,
        hourlyRate: null,
        isOff: false,
        reminderOverride: null,
        archivedAt: null,
      },
      {
        id: 'tpl-night',
        name: 'Night',
        icon: 'moon',
        color: '#5B7DB1',
        startTime: '19:00',
        endTime: '07:00',
        breakMinutes: 45,
        hourlyRate: null,
        isOff: false,
        reminderOverride: null,
        archivedAt: null,
      },
      {
        id: 'tpl-off',
        name: 'Off',
        icon: 'coffee',
        color: '#94A3B8',
        startTime: '00:00',
        endTime: '00:00',
        breakMinutes: 0,
        hourlyRate: null,
        isOff: true,
        reminderOverride: null,
        archivedAt: null,
      },
    ];

    // Simple 2-day rotation: Day on Day 1, Night on Day 2
    const original: Rotation = {
      id: 'rot-simple',
      name: 'Original 2-day',
      anchorDate: '2026-01-01',
      pattern: ['tpl-day', 'tpl-night'],
      startDate: '2026-01-01',
      endDate: null,
      active: true,
    };

    // New rotation effective from 2026-01-05: Straight Days
    const editInput: NewRotation = {
      name: 'Updated straight days',
      anchorDate: '2026-01-05',
      pattern: ['tpl-day', 'tpl-day'],
      startDate: '2026-01-05',
      endDate: null,
      active: true,
    };

    const plan = planRotationEdit(original, editInput, '2026-01-05');
    expect(plan.kind).toBe('split');

    if (plan.kind === 'split') {
      const activeRotations: Rotation[] = [
        plan.closedRotation,
        {
          ...plan.newRotation,
          id: 'rot-new',
        },
      ];

      // Resolve days around the boundary: 2026-01-01 to 2026-01-07
      const resolved = resolveRange('2026-01-01', '2026-01-07', {
        manualShifts: [],
        rotations: activeRotations,
        exceptions: [],
        templatesById: new Map(templates.map((t) => [t.id, t])),
      });

      // 2026-01-01 (Day 0 of original) => Day
      // 2026-01-02 (Day 1 of original) => Night
      // 2026-01-03 (Day 2 of original) => Day
      // 2026-01-04 (Day 3 of original) => Night
      // 2026-01-05 (Day 0 of new) => Day
      // 2026-01-06 (Day 1 of new) => Day
      // 2026-01-07 (Day 2 of new) => Day

      expect(resolved.get('2026-01-02')?.shifts[0]?.name).toBe('Night');
      expect(resolved.get('2026-01-04')?.shifts[0]?.name).toBe('Night');

      // After effectiveFrom, it resolves to Day according to the new pattern
      expect(resolved.get('2026-01-05')?.shifts[0]?.name).toBe('Day');
      expect(resolved.get('2026-01-06')?.shifts[0]?.name).toBe('Day');
      expect(resolved.get('2026-01-07')?.shifts[0]?.name).toBe('Day');
    }
  });
});
