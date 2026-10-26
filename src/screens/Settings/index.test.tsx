import { fireEvent, screen } from '@testing-library/react-native';
import { SettingsScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import {
  useRotationStore,
  useSettingsStore,
  useTemplateStore,
} from '@/store';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/domain';
import { shareService } from '@/services';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('@/db', () => ({
  repositories: {
    settings: {
      getOrCreate: jest.fn().mockResolvedValue({
        themeMode: 'auto',
        weekStart: 1,
        timeFormat: '24h',
        remindersEnabled: true,
        defaultMinutesBefore: [60, 30, 15],
        onboardingCompleted: true,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    scheduledReminders: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    shifts: {
      getAll: jest.fn().mockResolvedValue([]),
      getByDateRange: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    rotationExceptions: {
      getAll: jest.fn().mockResolvedValue([]),
      getByDateRange: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('SettingsScreen', () => {
  const testSettings: AppSettings = {
    themeMode: 'auto',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30, 15],
    onboardingCompleted: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      settings: testSettings,
      status: 'ready',
      error: null,
    });
    useTemplateStore.setState({
      templates: [
        {
          id: 'tpl-1',
          name: 'Day Shift',
          color: '#5B7DB1',
          icon: 'sun',
          startTime: '07:00',
          endTime: '15:30',
          breakMinutes: 30,
          hourlyRate: null,
          isOff: false,
          reminderOverride: null,
          archivedAt: null,
        },
      ],
      status: 'ready',
      error: null,
    });
    useRotationStore.setState({
      rotations: [
        {
          id: 'rot-1',
          name: '4-on-2-off',
          anchorDate: '2026-01-01',
          startDate: '2026-01-01',
          endDate: null,
          active: true,
          pattern: ['tpl-1'],
        },
      ],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });
  });

  it('renders settings sections, card items, accessories, and footer', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('PREFERENCES')).toBeTruthy();
    expect(screen.getByText('SCHEDULE')).toBeTruthy();
    expect(screen.getByText('DATA')).toBeTruthy();

    // Preferences
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('theme')).toBeTruthy();
    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();

    expect(screen.getByText('Start of Week')).toBeTruthy();
    expect(screen.getByText('First day of the week')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();

    expect(screen.getByText('Time Format')).toBeTruthy();
    expect(screen.getByText('Display time in 12 or 24 hour format')).toBeTruthy();
    expect(screen.getByText('12h')).toBeTruthy();
    expect(screen.getByText('24h')).toBeTruthy();

    // Schedule
    expect(screen.getByText('Shift Templates')).toBeTruthy();
    expect(screen.getByText('Manage your shift templates')).toBeTruthy();
    expect(screen.getByText('1 active')).toBeTruthy();

    expect(screen.getByText('Repeating Rotations')).toBeTruthy();
    expect(screen.getByText('Configure repeating shift cycles')).toBeTruthy();
    expect(screen.getByText('1 shifts')).toBeTruthy();

    expect(screen.getByText('Shift Reminders')).toBeTruthy();
    expect(screen.getByText('Set reminders before shifts')).toBeTruthy();

    // Data
    expect(screen.getByText('Export & Backup')).toBeTruthy();
    expect(screen.getByText('Export your data or create a backup')).toBeTruthy();
    expect(screen.getByText('Import Shifts')).toBeTruthy();
    expect(screen.getByText('Import shifts from a file')).toBeTruthy();
    expect(screen.getByText('Run Setup Wizard')).toBeTruthy();
    expect(screen.getByText('Reconfigure templates & preferences')).toBeTruthy();

    // Reset row & Footer
    expect(screen.getByText('Reset Preferences')).toBeTruthy();
    expect(screen.getByText('Restore default app settings')).toBeTruthy();
    expect(screen.getByText('myshift · v1.0.0')).toBeTruthy();
    expect(screen.getByText(/Made with/)).toBeTruthy();
    expect(screen.getByText(/by Kichu/)).toBeTruthy();
  });

  it('updates theme mode when segmented control option is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const darkOption = screen.getByText('Dark');
    await fireEvent.press(darkOption);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.themeMode).toBe('dark');
  });

  it('updates start of week when segmented control option is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const sunOption = screen.getByText('Sun');
    await fireEvent.press(sunOption);

    let updated = useSettingsStore.getState().settings;
    expect(updated?.weekStart).toBe(0);

    const monOption = screen.getByText('Mon');
    await fireEvent.press(monOption);
    updated = useSettingsStore.getState().settings;
    expect(updated?.weekStart).toBe(1);
  });

  it('updates time format when segmented control option is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const twelveHourOption = screen.getByText('12h');
    await fireEvent.press(twelveHourOption);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.timeFormat).toBe('12h');
  });

  it('navigates to TemplateList, RotationWizard, ReminderSettings, and Onboarding', async () => {
    await renderWithProviders(<SettingsScreen />);

    const templatesRow = screen.getByLabelText('Shift Templates');
    await fireEvent.press(templatesRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.TEMPLATE_LIST);

    const rotationsRow = screen.getByLabelText('Repeating Rotations');
    await fireEvent.press(rotationsRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.ROTATION_WIZARD);

    const remindersRow = screen.getByLabelText('Shift Reminders');
    await fireEvent.press(remindersRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.REMINDER_SETTINGS);

    const wizardRow = screen.getByLabelText('Run Setup Wizard');
    await fireEvent.press(wizardRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.ONBOARDING);
  });

  it('triggers backup export and opens restore backup sheet', async () => {
    const shareSpy = jest.spyOn(shareService, 'shareText').mockResolvedValue(true);
    await renderWithProviders(<SettingsScreen />);

    const exportRow = screen.getByLabelText('Export & Backup');
    await fireEvent.press(exportRow);
    expect(shareSpy).toHaveBeenCalled();

    const importRow = screen.getByLabelText('Import Shifts');
    await fireEvent.press(importRow);
    expect(screen.getByText('Restore from Backup')).toBeTruthy();

    shareSpy.mockRestore();
  });

  it('performs two-step inline confirmation to reset preferences', async () => {
    await renderWithProviders(<SettingsScreen />);

    const resetRow = screen.getByLabelText('Reset Preferences');
    await fireEvent.press(resetRow);

    expect(screen.getByText('Tap again to confirm reset')).toBeTruthy();

    const confirmRow = screen.getByLabelText('Tap again to confirm reset');
    await fireEvent.press(confirmRow);

    const updated = useSettingsStore.getState().settings;
    expect(updated).toEqual(DEFAULT_APP_SETTINGS);
  });
});
