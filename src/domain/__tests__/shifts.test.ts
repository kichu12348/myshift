import {
  doShiftsOverlapOnSameDate,
  getOffShiftTimes,
  getShiftTimes,
  isOvernightShift,
  resolveConflictingShiftIds,
  type LocalDate,
  type Shift,
  type TimeOfDay,
} from '@/domain';

function createTestShift(params: {
  id: string;
  date: LocalDate;
  templateId?: string | null;
  startTime?: TimeOfDay;
  endTime?: TimeOfDay;
  isOff?: boolean;
}): Shift {
  const isOff = params.isOff ?? false;
  const times = isOff
    ? getOffShiftTimes(params.date)
    : getShiftTimes(params.date, params.startTime ?? '07:00', params.endTime ?? '19:00');

  return {
    id: params.id,
    date: params.date,
    templateId: params.templateId ?? null,
    name: isOff ? 'Off Day' : 'Working Shift',
    icon: isOff ? 'home' : 'sun',
    color: '#F59E0B',
    isOff,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    breakMinutes: 0,
    notes: '',
    source: 'manual',
    rotationId: null,
    reminderOverride: null,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('domain/shifts', () => {
  describe('isOvernightShift', () => {
    it('returns true when !isOff and endMinutes <= startMinutes (e.g. 19:00 to 07:00)', () => {
      expect(isOvernightShift(1140, 420, false)).toBe(true);
    });

    it('returns true for 24-hour shift (startMinutes === endMinutes and !isOff)', () => {
      expect(isOvernightShift(420, 420, false)).toBe(true);
    });

    it('returns false when endMinutes > startMinutes (e.g. 07:00 to 19:00)', () => {
      expect(isOvernightShift(420, 1140, false)).toBe(false);
    });

    it('returns false when isOff is true even if endMinutes <= startMinutes', () => {
      expect(isOvernightShift(1140, 420, true)).toBe(false);
      expect(isOvernightShift(0, 0, true)).toBe(false);
    });

    it('supports shift object overload', () => {
      const times = getShiftTimes('2026-10-24', '19:00', '07:00');
      expect(
        isOvernightShift({
          date: '2026-10-24',
          endsAt: times.endsAt,
          isOff: false,
        }),
      ).toBe(true);

      const dayTimes = getShiftTimes('2026-10-24', '07:00', '19:00');
      expect(
        isOvernightShift({
          date: '2026-10-24',
          endsAt: dayTimes.endsAt,
          isOff: false,
        }),
      ).toBe(false);
    });
  });

  describe('doShiftsOverlapOnSameDate', () => {
    it('returns true when either shift is an Off shift', () => {
      expect(
        doShiftsOverlapOnSameDate(
          { startMinutes: 420, endMinutes: 1140, isOff: false },
          { startMinutes: 0, endMinutes: 0, isOff: true },
        ),
      ).toBe(true);

      expect(
        doShiftsOverlapOnSameDate(
          { startMinutes: 0, endMinutes: 0, isOff: true },
          { startMinutes: 420, endMinutes: 1140, isOff: false },
        ),
      ).toBe(true);

      expect(
        doShiftsOverlapOnSameDate(
          { startMinutes: 0, endMinutes: 0, isOff: true },
          { startMinutes: 0, endMinutes: 0, isOff: true },
        ),
      ).toBe(true);
    });

    it('allows non-overlapping back-to-back Day (07:00-19:00) + Night (19:00-07:00) double shifts', () => {
      const day = { startMinutes: 420, endMinutes: 1140, isOff: false };
      const night = { startMinutes: 1140, endMinutes: 420, isOff: false };

      expect(doShiftsOverlapOnSameDate(day, night)).toBe(false);
      expect(doShiftsOverlapOnSameDate(night, day)).toBe(false);
    });

    it('returns true for two identical Day shifts (07:00-19:00)', () => {
      const day1 = { startMinutes: 420, endMinutes: 1140, isOff: false };
      const day2 = { startMinutes: 420, endMinutes: 1140, isOff: false };

      expect(doShiftsOverlapOnSameDate(day1, day2)).toBe(true);
    });

    it('returns true for partially overlapping shifts (07:00-19:00 and 08:00-16:00)', () => {
      const day = { startMinutes: 420, endMinutes: 1140, isOff: false };
      const shortDay = { startMinutes: 480, endMinutes: 960, isOff: false };

      expect(doShiftsOverlapOnSameDate(day, shortDay)).toBe(true);
      expect(doShiftsOverlapOnSameDate(shortDay, day)).toBe(true);
    });

    it('returns true for overlapping overnight shifts (19:00-07:00 and 20:00-08:00)', () => {
      const night1 = { startMinutes: 1140, endMinutes: 420, isOff: false };
      const night2 = { startMinutes: 1200, endMinutes: 480, isOff: false };

      expect(doShiftsOverlapOnSameDate(night1, night2)).toBe(true);
      expect(doShiftsOverlapOnSameDate(night2, night1)).toBe(true);
    });

    it('allows back-to-back Morning (07:00-15:00) and Evening (15:00-23:00)', () => {
      const morning = { startMinutes: 420, endMinutes: 900, isOff: false };
      const evening = { startMinutes: 900, endMinutes: 1380, isOff: false };

      expect(doShiftsOverlapOnSameDate(morning, evening)).toBe(false);
      expect(doShiftsOverlapOnSameDate(evening, morning)).toBe(false);
    });
  });

  describe('resolveConflictingShiftIds', () => {
    const testDate: LocalDate = '2026-10-24';

    it('adding Day (07:00–19:00) twice on the same day replaces the first instead of duplicating', () => {
      const existingDay = createTestShift({
        id: 'shift-day-1',
        date: testDate,
        templateId: 'tpl-day',
        startTime: '07:00',
        endTime: '19:00',
      });

      const incomingDay = {
        templateId: 'tpl-day',
        startMinutes: 420,
        endMinutes: 1140,
        isOff: false,
      };

      const conflicts = resolveConflictingShiftIds([existingDay], incomingDay);
      expect(conflicts).toEqual(['shift-day-1']);
    });

    it('adding Off on a day with Day removes Day', () => {
      const existingDay = createTestShift({
        id: 'shift-day-1',
        date: testDate,
        templateId: 'tpl-day',
        startTime: '07:00',
        endTime: '19:00',
      });

      const incomingOff = {
        templateId: 'tpl-off',
        startMinutes: 0,
        endMinutes: 0,
        isOff: true,
      };

      const conflicts = resolveConflictingShiftIds([existingDay], incomingOff);
      expect(conflicts).toEqual(['shift-day-1']);
    });

    it('adding Day on a day with Off removes Off', () => {
      const existingOff = createTestShift({
        id: 'shift-off-1',
        date: testDate,
        templateId: 'tpl-off',
        isOff: true,
      });

      const incomingDay = {
        templateId: 'tpl-day',
        startMinutes: 420,
        endMinutes: 1140,
        isOff: false,
      };

      const conflicts = resolveConflictingShiftIds([existingOff], incomingDay);
      expect(conflicts).toEqual(['shift-off-1']);
    });

    it('adding Day (07:00–19:00) + Night (19:00–07:00) on the same day allows both (non-overlapping double shift)', () => {
      const existingDay = createTestShift({
        id: 'shift-day-1',
        date: testDate,
        templateId: 'tpl-day',
        startTime: '07:00',
        endTime: '19:00',
      });

      const incomingNight = {
        templateId: 'tpl-night',
        startMinutes: 1140,
        endMinutes: 420,
        isOff: false,
      };

      const conflicts = resolveConflictingShiftIds([existingDay], incomingNight);
      expect(conflicts).toEqual([]);
    });

    it('replaces existing shift when same templateId is used even if times were changed', () => {
      const existing = createTestShift({
        id: 'shift-1',
        date: testDate,
        templateId: 'tpl-flexible',
        startTime: '08:00',
        endTime: '16:00',
      });

      const incoming = {
        templateId: 'tpl-flexible',
        startMinutes: 420,
        endMinutes: 1140,
        isOff: false,
      };

      const conflicts = resolveConflictingShiftIds([existing], incoming);
      expect(conflicts).toEqual(['shift-1']);
    });

    it('clears all multiple working shifts when Off is added', () => {
      const shift1 = createTestShift({
        id: 's1',
        date: testDate,
        templateId: 'tpl-day',
        startTime: '07:00',
        endTime: '15:00',
      });
      const shift2 = createTestShift({
        id: 's2',
        date: testDate,
        templateId: 'tpl-evening',
        startTime: '15:00',
        endTime: '23:00',
      });

      const incomingOff = {
        templateId: 'tpl-off',
        startMinutes: 0,
        endMinutes: 0,
        isOff: true,
      };

      const conflicts = resolveConflictingShiftIds([shift1, shift2], incomingOff);
      expect(conflicts).toEqual(['s1', 's2']);
    });
  });
});
