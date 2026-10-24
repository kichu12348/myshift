import { fireEvent, screen } from '@testing-library/react-native';
import { SettingsScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import { useSettingsStore } from '@/store';
import type { AppSettings } from '@/domain';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<Record<string, unknown>>(
    '@react-navigation/native',
  );
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
      }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    scheduledReminders: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    shifts: {
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      settings: testSettings,
      status: 'ready',
      error: null,
    });
  });

  it('renders settings sections and preferences', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('APPEARANCE')).toBeTruthy();
    expect(screen.getByText('CALENDAR PREFERENCES')).toBeTruthy();
    expect(screen.getByText('SCHEDULE & REMINDERS')).toBeTruthy();
  });

  it('changes theme mode when chip is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const darkChip = screen.getByLabelText('Dark theme mode');
    await fireEvent.press(darkChip);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.themeMode).toBe('dark');
  });

  it('changes week start day when chip is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const sundayChip = screen.getByLabelText('Start week on Sunday');
    await fireEvent.press(sundayChip);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.weekStart).toBe(0);
  });

  it('changes time format when chip is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const twelveHourChip = screen.getByLabelText('12-hour time format');
    await fireEvent.press(twelveHourChip);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.timeFormat).toBe('12h');
  });

  it('navigates to ReminderSettings, RotationWizard, and TemplateList', async () => {
    await renderWithProviders(<SettingsScreen />);

    const remindersRow = screen.getByLabelText('Shift Reminders');
    await fireEvent.press(remindersRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.REMINDER_SETTINGS);

    const rotationsRow = screen.getByLabelText('Shift rotations');
    await fireEvent.press(rotationsRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.ROTATION_WIZARD);

    const templatesRow = screen.getByLabelText('Shift templates');
    await fireEvent.press(templatesRow);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.TEMPLATE_LIST);
  });
});
