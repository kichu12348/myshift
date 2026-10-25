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

  it('renders settings sections, card items, about info, and footer', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('PREFERENCES')).toBeTruthy();
    expect(screen.getByText('SCHEDULE & REMINDERS')).toBeTruthy();
    expect(screen.getByText('DATA & SETUP')).toBeTruthy();
    expect(screen.getByText('ABOUT')).toBeTruthy();

    expect(screen.getByText('Dark Mode')).toBeTruthy();
    expect(screen.getByText('Start of Week')).toBeTruthy();
    expect(screen.getByText('Time Format')).toBeTruthy();
    expect(screen.getByText('Shift Templates')).toBeTruthy();
    expect(screen.getByText('1 active template')).toBeTruthy();
    expect(screen.getByText('Repeating Rotations')).toBeTruthy();
    expect(screen.getByText('4-on-2-off')).toBeTruthy();
    expect(screen.getByText('Shift Reminders')).toBeTruthy();
    expect(screen.getByText('1h, 30m, 15m before')).toBeTruthy();

    expect(screen.getByText('myshift')).toBeTruthy();
    expect(screen.getByText('shift-work calendar & reminders')).toBeTruthy();
    expect(screen.getByText('Version')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();

    expect(screen.getByText(/Made Wid/)).toBeTruthy();
    expect(screen.getByText(/by Kichu/)).toBeTruthy();
  });

  it('toggles dark mode via Switch', async () => {
    await renderWithProviders(<SettingsScreen />);

    const darkModeSwitch = screen.getByLabelText('Dark Mode');
    expect(darkModeSwitch).toBeTruthy();

    await fireEvent.press(darkModeSwitch);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.themeMode).toBe('light');
  });

  it('updates start of week when dropdown option is selected', async () => {
    await renderWithProviders(<SettingsScreen />);

    const weekStartRow = screen.getByLabelText('Start of Week');
    await fireEvent.press(weekStartRow);

    const sundayOption = screen.getByLabelText('Sunday, First day: Sun · Traditional');
    await fireEvent.press(sundayOption);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.weekStart).toBe(0);
  });

  it('updates time format when dropdown option is selected', async () => {
    await renderWithProviders(<SettingsScreen />);

    const timeFormatRow = screen.getByLabelText('Time Format');
    await fireEvent.press(timeFormatRow);

    const twelveHourOption = screen.getByLabelText('12-Hour, 7:00 PM · Standard 12-hour clock');
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

  it('performs two-step danger confirmation to reset preferences', async () => {
    await renderWithProviders(<SettingsScreen />);

    const resetRow = screen.getByLabelText('Reset Preferences');
    await fireEvent.press(resetRow);

    expect(screen.getByText('Reset all preferences to defaults?')).toBeTruthy();
    const confirmButton = screen.getByLabelText('Confirm reset preferences');
    const cancelButton = screen.getByLabelText('Cancel reset preferences');
    expect(confirmButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();

    // Cancel first
    await fireEvent.press(cancelButton);
    expect(screen.queryByText('Reset all preferences to defaults?')).toBeNull();

    // Re-open and confirm
    await fireEvent.press(screen.getByLabelText('Reset Preferences'));
    await fireEvent.press(screen.getByLabelText('Confirm reset preferences'));

    const updated = useSettingsStore.getState().settings;
    expect(updated).toEqual(DEFAULT_APP_SETTINGS);
  });
});
