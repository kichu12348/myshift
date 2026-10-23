import { getShiftTimes } from '@/domain';
import { formatLongDate, formatShiftTimeRange } from '../dateLabels';

describe('utils/dateLabels', () => {
  it('formats long date with weekday, day, month and year', () => {
    expect(formatLongDate('2026-10-24')).toBe('Saturday, 24 October 2026');
  });

  describe('formatShiftTimeRange', () => {
    it('returns "All day" when isOff is true', () => {
      expect(formatShiftTimeRange(0, 0, true, '24h')).toBe('All day');
      expect(formatShiftTimeRange(0, 0, true, '12h')).toBe('All day');
    });

    it('formats daytime shift in 24h mode', () => {
      const times = getShiftTimes('2026-10-24', '07:00', '19:00');
      expect(formatShiftTimeRange(times.startsAt, times.endsAt, false, '24h')).toBe(
        '07:00 \u2013 19:00',
      );
    });

    it('formats daytime shift in 12h mode', () => {
      const times = getShiftTimes('2026-10-24', '07:00', '19:00');
      expect(formatShiftTimeRange(times.startsAt, times.endsAt, false, '12h')).toBe(
        '7:00 AM \u2013 7:00 PM',
      );
    });

    it('formats overnight shift with (+1d) suffix in 24h mode', () => {
      const times = getShiftTimes('2026-10-24', '19:00', '07:00');
      expect(formatShiftTimeRange(times.startsAt, times.endsAt, false, '24h')).toBe(
        '19:00 \u2013 07:00 (+1d)',
      );
    });

    it('formats overnight shift with (+1d) suffix in 12h mode', () => {
      const times = getShiftTimes('2026-10-24', '19:00', '07:00');
      expect(formatShiftTimeRange(times.startsAt, times.endsAt, false, '12h')).toBe(
        '7:00 PM \u2013 7:00 AM (+1d)',
      );
    });
  });
});
