import { mapRowToSettings } from '../settingsRepository';
import { DataIntegrityError } from '../../errors';

describe('settingsRepository row mapping and validation', () => {
  it('maps valid database row to domain AppSettings including onboardingCompleted', () => {
    const row = {
      id: 1,
      remindersEnabled: true,
      defaultMinutesBefore: [60, 30, 15],
      themeMode: 'dark' as const,
      weekStart: 1,
      timeFormat: '24h' as const,
      onboardingCompleted: false,
    };

    const domain = mapRowToSettings(row);
    expect(domain).toEqual({
      remindersEnabled: true,
      defaultMinutesBefore: [60, 30, 15],
      themeMode: 'dark',
      weekStart: 1,
      timeFormat: '24h',
      onboardingCompleted: false,
    });

    const completedDomain = mapRowToSettings({
      ...row,
      onboardingCompleted: true,
    });
    expect(completedDomain.onboardingCompleted).toBe(true);
  });

  it('throws DataIntegrityError when weekStart is neither 0 nor 1', () => {
    const invalidRow = {
      id: 1,
      remindersEnabled: true,
      defaultMinutesBefore: [30],
      themeMode: 'auto' as const,
      weekStart: 2,
      timeFormat: '12h' as const,
      onboardingCompleted: true,
    };

    expect(() => mapRowToSettings(invalidRow)).toThrow(DataIntegrityError);
  });

  it('throws DataIntegrityError when themeMode is not in allowed enum', () => {
    const invalidRow = {
      id: 1,
      remindersEnabled: true,
      defaultMinutesBefore: [30],
      themeMode: 'neon' as unknown as 'auto',
      weekStart: 1,
      timeFormat: '24h' as const,
      onboardingCompleted: false,
    };

    expect(() => mapRowToSettings(invalidRow)).toThrow(DataIntegrityError);
  });
});
