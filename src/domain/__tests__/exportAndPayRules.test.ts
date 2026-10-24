import {
  baseHourlyPayRule,
  computeMonthlyStats,
  createBackupPayload,
  createPayRules,
  dailyOvertimePayRule,
  parseBackupPayload,
  shiftsToCsv,
  weekendMultiplierPayRule,
  type AppSettings,
  type BackupPayload,
  type CreateBackupData,
  type ResolvedShift,
  type Rotation,
  type RotationException,
  type Shift,
  type ShiftTemplate,
} from '@/domain';

describe('Pay Strategy Rules and Composition', () => {
  const fakeTemplate: ShiftTemplate = {
    id: 'template-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    startTime: '08:00',
    endTime: '18:00',
    breakMinutes: 60,
    hourlyRate: 30,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  const templatesById = new Map<string, ShiftTemplate>([[fakeTemplate.id, fakeTemplate]]);

  // 2026-10-24 is a Saturday (weekend)
  const weekendShift: ResolvedShift = {
    id: 'shift-sat',
    date: '2026-10-24',
    templateId: fakeTemplate.id,
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: new Date(2026, 9, 24, 8, 0).getTime(),
    endsAt: new Date(2026, 9, 24, 18, 0).getTime(), // 10h gross = 600m gross, 60m break = 540m (9h) net
    breakMinutes: 60,
    notes: 'Weekend shift',
    origin: 'manual',
    rotationId: null,
    reminderOverride: null,
  };

  // 2026-10-21 is a Wednesday (weekday)
  const weekdayShift: ResolvedShift = {
    id: 'shift-wed',
    date: '2026-10-21',
    templateId: fakeTemplate.id,
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: new Date(2026, 9, 21, 8, 0).getTime(),
    endsAt: new Date(2026, 9, 21, 18, 0).getTime(),
    breakMinutes: 60,
    notes: 'Weekday shift',
    origin: 'manual',
    rotationId: null,
    reminderOverride: null,
  };

  it('calculates weekend multiplier premium on weekend and zero on weekday', () => {
    const rule15 = weekendMultiplierPayRule(1.5);

    // 9 net hours * $30/hr = $270 base.
    // Extra premium: (9 * 30 * (1.5 - 1)) = 9 * 30 * 0.5 = $135.
    const weekendPremium = rule15({
      shift: weekendShift,
      netMinutes: 540,
      hourlyRate: 30,
    });
    expect(weekendPremium).toBe(135);

    const weekdayPremium = rule15({
      shift: weekdayShift,
      netMinutes: 540,
      hourlyRate: 30,
    });
    expect(weekdayPremium).toBe(0);

    // Multiplier <= 1 yields 0
    const rule10 = weekendMultiplierPayRule(1.0);
    expect(rule10({ shift: weekendShift, netMinutes: 540, hourlyRate: 30 })).toBe(0);
  });

  it('calculates daily overtime premium for net minutes exceeding threshold', () => {
    // 8 hour threshold = 480 minutes; 1.5x multiplier
    const overtimeRule = dailyOvertimePayRule(480, 1.5);

    // 9 net hours = 540 minutes (60 minutes overtime)
    // Extra premium: (60 / 60) * 30 * (1.5 - 1) = 1 * 30 * 0.5 = $15
    const overtimePremium = overtimeRule({
      shift: weekendShift,
      netMinutes: 540,
      hourlyRate: 30,
    });
    expect(overtimePremium).toBe(15);

    // 8 net hours = 480 minutes (0 overtime)
    const noOvertimePremium = overtimeRule({
      shift: weekdayShift,
      netMinutes: 480,
      hourlyRate: 30,
    });
    expect(noOvertimePremium).toBe(0);

    // Multiplier <= 1 or threshold < 0
    expect(
      dailyOvertimePayRule(480, 1.0)({ shift: weekendShift, netMinutes: 540, hourlyRate: 30 }),
    ).toBe(0);
    expect(
      dailyOvertimePayRule(-10, 1.5)({ shift: weekendShift, netMinutes: 540, hourlyRate: 30 }),
    ).toBe(0);
  });

  it('composes pay rules with baseHourlyPayRule in computeMonthlyStats', () => {
    const rules = createPayRules({
      weekendMultiplier: 1.5,
      overtimeThresholdMinutes: 480,
      overtimeMultiplier: 1.5,
    });

    expect(rules).toHaveLength(3);

    // On Saturday 9h shift:
    // Base: 9h * $30 = $270
    // Weekend premium: 9h * $30 * 0.5 = $135
    // Overtime premium: 1h * $30 * 0.5 = $15
    // Total Saturday: $420
    //
    // On Wednesday 9h shift:
    // Base: 9h * $30 = $270
    // Weekend premium: $0
    // Overtime premium: 1h * $30 * 0.5 = $15
    // Total Wednesday: $285
    // Combined earnings: $420 + $285 = $705
    const summary = computeMonthlyStats([weekendShift, weekdayShift], templatesById, rules);

    expect(summary.workingShiftCount).toBe(2);
    expect(summary.totalNetMinutes).toBe(1080); // 18 hours
    expect(summary.totalEstimatedEarnings).toBe(705);
  });

  it('creates default pay rules when no options or multipliers <= 1 are provided', () => {
    const defaultRules = createPayRules();
    expect(defaultRules).toHaveLength(1);
    expect(defaultRules[0]).toBe(baseHourlyPayRule);

    const inactiveRules = createPayRules({
      weekendMultiplier: 1.0,
      overtimeMultiplier: 1.0,
      overtimeThresholdMinutes: 480,
    });
    expect(inactiveRules).toHaveLength(1);
  });
});

describe('shiftsToCsv', () => {
  it('generates standard header for empty shifts list', () => {
    const csv = shiftsToCsv([]);
    expect(csv).toBe('Date,Name,Start,End,BreakMinutes,NetHours,Origin,Notes');
  });

  it('formats working shifts and off shifts correctly', () => {
    const workingShift: ResolvedShift = {
      id: 'shift-1',
      date: '2026-10-24',
      templateId: 'template-day',
      name: 'Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      breakMinutes: 60,
      notes: 'Standard day',
      origin: 'rotation',
      rotationId: 'rot-1',
      reminderOverride: null,
    };

    const offShift: ResolvedShift = {
      id: 'shift-off',
      date: '2026-10-25',
      templateId: 'template-off',
      name: 'Off',
      icon: 'slash',
      color: '#94A3B8',
      isOff: true,
      startsAt: new Date(2026, 9, 25, 0, 0).getTime(),
      endsAt: new Date(2026, 9, 25, 0, 0).getTime(),
      breakMinutes: 0,
      notes: 'Scheduled off',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const csv = shiftsToCsv([workingShift, offShift]);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('Date,Name,Start,End,BreakMinutes,NetHours,Origin,Notes');
    expect(lines[1]).toBe('2026-10-24,Day Shift,07:00,19:00,60,11,rotation,Standard day');
    expect(lines[2]).toBe('2026-10-25,Off,,,0,0,manual,Scheduled off');
  });

  it('properly escapes commas, quotes, and newlines in CSV fields per RFC-4180', () => {
    const shiftWithSpecialChars: ResolvedShift = {
      id: 'shift-special',
      date: '2026-10-26',
      templateId: null,
      name: 'Shift, "Complex"',
      icon: 'star',
      color: '#10B981',
      isOff: false,
      startsAt: new Date(2026, 9, 26, 8, 0).getTime(),
      endsAt: new Date(2026, 9, 26, 16, 0).getTime(),
      breakMinutes: 30,
      notes: 'Notes with, comma\nand "quotes" across\r\nlines',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const csv = shiftsToCsv([shiftWithSpecialChars]);

    // Name must be enclosed in quotes and internal quotes doubled: "Shift, ""Complex"""
    expect(csv).toContain('"Shift, ""Complex"""');

    // Notes must be enclosed in quotes and internal quotes doubled
    expect(csv).toContain('"Notes with, comma\nand ""quotes"" across\r\nlines"');
  });
});

describe('createBackupPayload and parseBackupPayload', () => {
  const sampleSettings: AppSettings = {
    themeMode: 'dark',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30, 15],
    onboardingCompleted: false,
  };

  const sampleTemplate: ShiftTemplate = {
    id: 'tpl-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    hourlyRate: 25.5,
    isOff: false,
    reminderOverride: [45],
    archivedAt: null,
  };

  const sampleRotation: Rotation = {
    id: 'rot-1',
    name: '4-on-4-off',
    anchorDate: '2026-10-01',
    pattern: ['tpl-1', 'tpl-1', null, null],
    startDate: '2026-10-01',
    endDate: null,
    active: true,
  };

  const sampleException: RotationException = {
    rotationId: 'rot-1',
    date: '2026-10-03',
    kind: 'skip',
    templateId: null,
  };

  const sampleShift: Shift = {
    id: 'shift-1',
    date: '2026-10-24',
    templateId: 'tpl-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: 1729756800000,
    endsAt: 1729789200000,
    breakMinutes: 60,
    notes: 'Roundtrip test shift',
    source: 'manual',
    rotationId: null,
    reminderOverride: null,
    createdAt: 1729750000000,
    updatedAt: 1729750000000,
  };

  const validBackupData: CreateBackupData = {
    settings: sampleSettings,
    templates: [sampleTemplate],
    rotations: [sampleRotation],
    exceptions: [sampleException],
    shifts: [sampleShift],
    exportedAt: 1729759999000,
  };

  it('performs round-trip serialization and strict parsing', () => {
    const rawJson = createBackupPayload(validBackupData);
    expect(rawJson).toContain('"version": 1');
    expect(rawJson).toContain('"exportedAt": 1729759999000');

    const parsed: BackupPayload = parseBackupPayload(rawJson);

    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe(1729759999000);
    expect(parsed.settings).toEqual(sampleSettings);
    expect(parsed.templates).toHaveLength(1);
    expect(parsed.templates[0]).toEqual(sampleTemplate);
    expect(parsed.rotations).toHaveLength(1);
    expect(parsed.rotations[0]).toEqual(sampleRotation);
    expect(parsed.exceptions).toHaveLength(1);
    expect(parsed.exceptions[0]).toEqual(sampleException);
    expect(parsed.shifts).toHaveLength(1);
    expect(parsed.shifts[0]).toEqual(sampleShift);
  });

  it('rejects empty input or malformed JSON syntax', () => {
    expect(() => parseBackupPayload('')).toThrow('Invalid backup payload: empty input');
    expect(() => parseBackupPayload('   ')).toThrow('Invalid backup payload: empty input');
    expect(() => parseBackupPayload('{ "version": 1, invalidJson }')).toThrow(
      'Invalid backup payload: malformed JSON',
    );
  });

  it('rejects non-object root or unsupported versions', () => {
    expect(() => parseBackupPayload('["not", "an", "object"]')).toThrow(
      'Invalid backup payload: root must be a JSON object',
    );
    expect(() => parseBackupPayload(JSON.stringify({ version: 2 }))).toThrow(
      "Invalid backup payload: unsupported version '2'",
    );
  });

  it('rejects invalid or missing exportedAt timestamp', () => {
    const invalid = {
      ...validBackupData,
      version: 1,
      exportedAt: 'not-a-number',
    };
    expect(() => parseBackupPayload(JSON.stringify(invalid))).toThrow(
      'Invalid backup payload: missing or invalid "exportedAt" timestamp',
    );
  });

  it('rejects malformed settings object', () => {
    const invalidSettings = {
      ...validBackupData,
      version: 1,
      settings: {
        ...sampleSettings,
        themeMode: 'neon-purple', // Invalid theme mode
      },
    };
    expect(() => parseBackupPayload(JSON.stringify(invalidSettings))).toThrow(
      'Invalid backup payload: invalid or malformed "settings" object',
    );
  });

  it('rejects malformed template, rotation, exception, or shift objects', () => {
    const invalidTemplate = {
      ...validBackupData,
      version: 1,
      templates: [
        {
          ...sampleTemplate,
          color: 'blue', // Must be 6-digit hex #RRGGBB
        },
      ],
    };
    expect(() => parseBackupPayload(JSON.stringify(invalidTemplate))).toThrow(
      'Invalid backup payload: "templates" must be an array of valid ShiftTemplate objects',
    );

    const invalidRotation = {
      ...validBackupData,
      version: 1,
      rotations: [
        {
          ...sampleRotation,
          pattern: [], // Must not be empty
        },
      ],
    };
    expect(() => parseBackupPayload(JSON.stringify(invalidRotation))).toThrow(
      'Invalid backup payload: "rotations" must be an array of valid Rotation objects',
    );

    const invalidException = {
      ...validBackupData,
      version: 1,
      exceptions: [
        {
          ...sampleException,
          kind: 'unknown-kind',
        },
      ],
    };
    expect(() => parseBackupPayload(JSON.stringify(invalidException))).toThrow(
      'Invalid backup payload: "exceptions" must be an array of valid RotationException objects',
    );

    const invalidShift = {
      ...validBackupData,
      version: 1,
      shifts: [
        {
          ...sampleShift,
          source: 'invalid-source',
        },
      ],
    };
    expect(() => parseBackupPayload(JSON.stringify(invalidShift))).toThrow(
      'Invalid backup payload: "shifts" must be an array of valid Shift objects',
    );
  });
});
