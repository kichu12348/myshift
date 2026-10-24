import {
  baseHourlyPayRule,
  computeMonthlyStats,
  computeShiftDurationMinutes,
  formatDurationHoursMinutes,
  type ResolvedShift,
  type ShiftTemplate,
} from '../index';

describe('computeShiftDurationMinutes', () => {
  it('computes correct duration for a standard 12-hour day shift with 30m break', () => {
    const shift: ResolvedShift = {
      id: 's1',
      date: '2026-06-01',
      templateId: 'tpl-day',
      name: 'Day',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date('2026-06-01T07:00:00Z').getTime(),
      endsAt: new Date('2026-06-01T19:00:00Z').getTime(),
      breakMinutes: 30,
      notes: '',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const duration = computeShiftDurationMinutes(shift);
    expect(duration.grossMinutes).toBe(720);
    expect(duration.breakMinutes).toBe(30);
    expect(duration.netMinutes).toBe(690);
  });

  it('computes correct duration for a 12-hour overnight shift spanning two dates', () => {
    const shift: ResolvedShift = {
      id: 's2',
      date: '2026-06-01',
      templateId: 'tpl-night',
      name: 'Night',
      icon: 'moon',
      color: '#5B7DB1',
      isOff: false,
      startsAt: new Date('2026-06-01T19:00:00Z').getTime(),
      endsAt: new Date('2026-06-02T07:00:00Z').getTime(),
      breakMinutes: 45,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    };

    const duration = computeShiftDurationMinutes(shift);
    expect(duration.grossMinutes).toBe(720);
    expect(duration.breakMinutes).toBe(45);
    expect(duration.netMinutes).toBe(675);
  });

  it('returns 0 for Off shifts', () => {
    const shift: ResolvedShift = {
      id: 's-off',
      date: '2026-06-03',
      templateId: 'tpl-off',
      name: 'Off',
      icon: 'coffee',
      color: '#94A3B8',
      isOff: true,
      startsAt: new Date('2026-06-03T00:00:00Z').getTime(),
      endsAt: new Date('2026-06-03T00:00:00Z').getTime(),
      breakMinutes: 0,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    };

    const duration = computeShiftDurationMinutes(shift);
    expect(duration.grossMinutes).toBe(0);
    expect(duration.breakMinutes).toBe(0);
    expect(duration.netMinutes).toBe(0);
  });

  it('clamps net minutes to 0 if break minutes exceed gross duration', () => {
    const shift: ResolvedShift = {
      id: 's-short',
      date: '2026-06-01',
      templateId: null,
      name: 'Meeting',
      icon: 'briefcase',
      color: '#EF4444',
      isOff: false,
      startsAt: new Date('2026-06-01T10:00:00Z').getTime(),
      endsAt: new Date('2026-06-01T10:30:00Z').getTime(), // 30m
      breakMinutes: 60,
      notes: '',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const duration = computeShiftDurationMinutes(shift);
    expect(duration.grossMinutes).toBe(30);
    expect(duration.breakMinutes).toBe(60);
    expect(duration.netMinutes).toBe(0);
  });

  it('returns 0 for zero or inverted shift times', () => {
    const shift: ResolvedShift = {
      id: 's-invalid',
      date: '2026-06-01',
      templateId: null,
      name: 'Bad Time',
      icon: 'alert-circle',
      color: '#EF4444',
      isOff: false,
      startsAt: 2000,
      endsAt: 1000,
      breakMinutes: 0,
      notes: '',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const duration = computeShiftDurationMinutes(shift);
    expect(duration.grossMinutes).toBe(0);
    expect(duration.breakMinutes).toBe(0);
    expect(duration.netMinutes).toBe(0);
  });
});

describe('formatDurationHoursMinutes', () => {
  it('formats 0 or negative minutes as "0h"', () => {
    expect(formatDurationHoursMinutes(0)).toBe('0h');
    expect(formatDurationHoursMinutes(-10)).toBe('0h');
  });

  it('formats minutes under an hour as "Xm"', () => {
    expect(formatDurationHoursMinutes(45)).toBe('45m');
    expect(formatDurationHoursMinutes(1)).toBe('1m');
  });

  it('formats exact whole hours as "Xh"', () => {
    expect(formatDurationHoursMinutes(60)).toBe('1h');
    expect(formatDurationHoursMinutes(720)).toBe('12h');
  });

  it('formats mixed hours and minutes as "Xh Ym"', () => {
    expect(formatDurationHoursMinutes(750)).toBe('12h 30m');
    expect(formatDurationHoursMinutes(2235)).toBe('37h 15m');
  });
});

describe('computeMonthlyStats', () => {
  const dayTemplate: ShiftTemplate = {
    id: 'tpl-day',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    hourlyRate: 40.0,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  const nightTemplate: ShiftTemplate = {
    id: 'tpl-night',
    name: 'Night',
    icon: 'moon',
    color: '#5B7DB1',
    startTime: '19:00',
    endTime: '07:00',
    breakMinutes: 60,
    hourlyRate: 45.0,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  const offTemplate: ShiftTemplate = {
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
  };

  const templatesById = new Map<string, ShiftTemplate>([
    ['tpl-day', dayTemplate],
    ['tpl-night', nightTemplate],
    ['tpl-off', offTemplate],
  ]);

  const shifts: ResolvedShift[] = [
    // 2 Day shifts (each 720m gross, 30m break, 690m net = 11.5h * $40 = $460)
    {
      id: 'd1',
      date: '2026-06-01',
      templateId: 'tpl-day',
      name: 'Day',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date('2026-06-01T07:00:00Z').getTime(),
      endsAt: new Date('2026-06-01T19:00:00Z').getTime(),
      breakMinutes: 30,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    },
    {
      id: 'd2',
      date: '2026-06-02',
      templateId: 'tpl-day',
      name: 'Day',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date('2026-06-02T07:00:00Z').getTime(),
      endsAt: new Date('2026-06-02T19:00:00Z').getTime(),
      breakMinutes: 30,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    },
    // 1 Night shift (720m gross, 60m break, 660m net = 11h * $45 = $495)
    {
      id: 'n1',
      date: '2026-06-03',
      templateId: 'tpl-night',
      name: 'Night',
      icon: 'moon',
      color: '#5B7DB1',
      isOff: false,
      startsAt: new Date('2026-06-03T19:00:00Z').getTime(),
      endsAt: new Date('2026-06-04T07:00:00Z').getTime(),
      breakMinutes: 60,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    },
    // 2 Off days
    {
      id: 'off1',
      date: '2026-06-05',
      templateId: 'tpl-off',
      name: 'Off',
      icon: 'coffee',
      color: '#94A3B8',
      isOff: true,
      startsAt: new Date('2026-06-05T00:00:00Z').getTime(),
      endsAt: new Date('2026-06-05T00:00:00Z').getTime(),
      breakMinutes: 0,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    },
    {
      id: 'off2',
      date: '2026-06-06',
      templateId: 'tpl-off',
      name: 'Off',
      icon: 'coffee',
      color: '#94A3B8',
      isOff: true,
      startsAt: new Date('2026-06-06T00:00:00Z').getTime(),
      endsAt: new Date('2026-06-06T00:00:00Z').getTime(),
      breakMinutes: 0,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    },
  ];

  it('aggregates total working shifts, off days, and minutes correctly', () => {
    const summary = computeMonthlyStats(shifts, templatesById);

    expect(summary.workingShiftCount).toBe(3);
    expect(summary.offDayCount).toBe(2);

    // Gross: 720 + 720 + 720 = 2160
    expect(summary.totalGrossMinutes).toBe(2160);
    // Break: 30 + 30 + 60 = 120
    expect(summary.totalBreakMinutes).toBe(120);
    // Net: 690 + 690 + 660 = 2040
    expect(summary.totalNetMinutes).toBe(2040);

    // Earnings: $460 (d1) + $460 (d2) + $495 (n1) = $1415
    expect(summary.totalEstimatedEarnings).toBe(1415);
  });

  it('returns breakdown sorted by net minutes descending with Off days last', () => {
    const summary = computeMonthlyStats(shifts, templatesById);

    expect(summary.breakdown).toHaveLength(3);

    // 1st: Day shift (1380 net minutes)
    expect(summary.breakdown[0]?.name).toBe('Day');
    expect(summary.breakdown[0]?.shiftCount).toBe(2);
    expect(summary.breakdown[0]?.totalNetMinutes).toBe(1380);
    expect(summary.breakdown[0]?.totalBreakMinutes).toBe(60);
    expect(summary.breakdown[0]?.estimatedEarnings).toBe(920);

    // 2nd: Night shift (660 net minutes)
    expect(summary.breakdown[1]?.name).toBe('Night');
    expect(summary.breakdown[1]?.shiftCount).toBe(1);
    expect(summary.breakdown[1]?.totalNetMinutes).toBe(660);
    expect(summary.breakdown[1]?.estimatedEarnings).toBe(495);

    // 3rd: Off day (0 net minutes, isOff true)
    expect(summary.breakdown[2]?.name).toBe('Off');
    expect(summary.breakdown[2]?.isOff).toBe(true);
    expect(summary.breakdown[2]?.shiftCount).toBe(2);
    expect(summary.breakdown[2]?.estimatedEarnings).toBeNull();
  });

  it('returns null for totalEstimatedEarnings when no shifts have hourly rates', () => {
    const noRateTemplates = new Map<string, ShiftTemplate>([
      ['tpl-day', { ...dayTemplate, hourlyRate: null }],
      ['tpl-night', { ...nightTemplate, hourlyRate: null }],
    ]);

    const summary = computeMonthlyStats(shifts.slice(0, 3), noRateTemplates);
    expect(summary.totalEstimatedEarnings).toBeNull();
    expect(summary.breakdown[0]?.estimatedEarnings).toBeNull();
  });

  it('supports custom pay rule strategies', () => {
    // 1.5x overtime multiplier rule
    const overtimeRule = (ctx: Parameters<typeof baseHourlyPayRule>[0]): number => {
      return baseHourlyPayRule(ctx) * 1.5;
    };

    const firstShift = shifts[0];
    if (firstShift === undefined) {
      throw new Error('Expected at least one shift fixture');
    }

    const summary = computeMonthlyStats([firstShift], templatesById, [overtimeRule]);
    // Standard pay: 11.5h * $40 = $460 -> 1.5x = $690
    expect(summary.totalEstimatedEarnings).toBe(690);
  });
});
