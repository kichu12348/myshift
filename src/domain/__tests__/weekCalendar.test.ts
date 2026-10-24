import {
  daysBetween,
  getDayOfWeek,
  getWeekDates,
  getWeekDateRange,
  getWeekStartDate,
  type LocalDate,
} from '@/domain';

describe('weekCalendar domain helpers', () => {
  describe('Monday week start (weekStart = 1)', () => {
    it('returns the same date when date is already a Monday', () => {
      const monday = '2026-10-19' as LocalDate;
      expect(getDayOfWeek(monday)).toBe(1);
      expect(getWeekStartDate(monday, 1)).toBe('2026-10-19');
    });

    it('returns the preceding Monday for Sunday and midweek days', () => {
      const wednesday = '2026-10-21' as LocalDate;
      const sunday = '2026-10-25' as LocalDate;
      expect(getDayOfWeek(wednesday)).toBe(3);
      expect(getDayOfWeek(sunday)).toBe(0);

      expect(getWeekStartDate(wednesday, 1)).toBe('2026-10-19');
      expect(getWeekStartDate(sunday, 1)).toBe('2026-10-19');
    });

    it('computes week start across month boundaries', () => {
      // 2026-10-01 is Thursday, preceding Monday is 2026-09-28
      const octFirst = '2026-10-01' as LocalDate;
      expect(getDayOfWeek(octFirst)).toBe(4);
      expect(getWeekStartDate(octFirst, 1)).toBe('2026-09-28');

      const sepLast = '2026-09-30' as LocalDate;
      expect(getWeekStartDate(sepLast, 1)).toBe('2026-09-28');
    });

    it('computes week start across year boundaries', () => {
      // 2026-01-01 is Thursday, preceding Monday is 2025-12-29
      const newYearDay = '2026-01-01' as LocalDate;
      expect(getDayOfWeek(newYearDay)).toBe(4);
      expect(getWeekStartDate(newYearDay, 1)).toBe('2025-12-29');
    });

    it('computes week start across leap year day', () => {
      // 2024-02-29 is Thursday, preceding Monday is 2024-02-26
      const leapDay = '2024-02-29' as LocalDate;
      expect(getDayOfWeek(leapDay)).toBe(4);
      expect(getWeekStartDate(leapDay, 1)).toBe('2024-02-26');

      const marchFirst = '2024-03-01' as LocalDate;
      expect(getWeekStartDate(marchFirst, 1)).toBe('2024-02-26');
    });
  });

  describe('Sunday week start (weekStart = 0)', () => {
    it('returns the same date when date is already a Sunday', () => {
      const sunday = '2026-10-18' as LocalDate;
      expect(getDayOfWeek(sunday)).toBe(0);
      expect(getWeekStartDate(sunday, 0)).toBe('2026-10-18');
    });

    it('returns the preceding Sunday for Saturday and midweek days', () => {
      const wednesday = '2026-10-21' as LocalDate;
      const saturday = '2026-10-24' as LocalDate;
      expect(getDayOfWeek(wednesday)).toBe(3);
      expect(getDayOfWeek(saturday)).toBe(6);

      expect(getWeekStartDate(wednesday, 0)).toBe('2026-10-18');
      expect(getWeekStartDate(saturday, 0)).toBe('2026-10-18');
    });

    it('computes week start across month boundaries', () => {
      // 2026-10-31 is Saturday, preceding Sunday is 2026-10-25
      const octThirtyOne = '2026-10-31' as LocalDate;
      expect(getDayOfWeek(octThirtyOne)).toBe(6);
      expect(getWeekStartDate(octThirtyOne, 0)).toBe('2026-10-25');

      // 2026-11-01 is Sunday, so it is the start of its own week
      const novFirst = '2026-11-01' as LocalDate;
      expect(getDayOfWeek(novFirst)).toBe(0);
      expect(getWeekStartDate(novFirst, 0)).toBe('2026-11-01');
    });

    it('computes week start across year boundaries', () => {
      // 2026-01-01 is Thursday, preceding Sunday is 2025-12-28
      const newYearDay = '2026-01-01' as LocalDate;
      expect(getWeekStartDate(newYearDay, 0)).toBe('2025-12-28');
    });
  });

  describe('getWeekDates and getWeekDateRange', () => {
    it('returns 7 consecutive dates starting on weekStart', () => {
      const date = '2026-10-21' as LocalDate;
      const weekDates = getWeekDates(date, 1);

      expect(weekDates).toHaveLength(7);
      expect(weekDates[0]).toBe('2026-10-19');
      expect(weekDates[1]).toBe('2026-10-20');
      expect(weekDates[2]).toBe('2026-10-21');
      expect(weekDates[3]).toBe('2026-10-22');
      expect(weekDates[4]).toBe('2026-10-23');
      expect(weekDates[5]).toBe('2026-10-24');
      expect(weekDates[6]).toBe('2026-10-25');
    });

    it('returns matching range from and to', () => {
      const date = '2026-10-21' as LocalDate;
      const range = getWeekDateRange(date, 1);

      expect(range.from).toBe('2026-10-19');
      expect(range.to).toBe('2026-10-25');
      expect(daysBetween(range.from, range.to)).toBe(6);
    });

    it('handles week crossing month boundary', () => {
      const date = '2026-10-01' as LocalDate;
      const dates = getWeekDates(date, 1);

      expect(dates).toEqual([
        '2026-09-28',
        '2026-09-29',
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
        '2026-10-04',
      ]);
      const range = getWeekDateRange(date, 1);
      expect(range.from).toBe('2026-09-28');
      expect(range.to).toBe('2026-10-04');
    });
  });
});
