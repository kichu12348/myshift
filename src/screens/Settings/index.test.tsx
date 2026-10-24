import { fireEvent, screen } from '@testing-library/react-native';
import { SettingsScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import { useSettingsStore } from '@/store';
import type { AppSettings } from '@/domain';
import { shareService, type ShareOptions } from '@/services';

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
  };

  let shareSpy: jest.SpyInstance<Promise<boolean>, [options: ShareOptions]>;

  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy = jest.spyOn(shareService, 'shareText').mockResolvedValue(true);
    useSettingsStore.setState({
      settings: testSettings,
      status: 'ready',
      error: null,
    });
  });

  afterEach(() => {
    shareSpy.mockRestore();
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

  it('exports monthly schedule as CSV when pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const exportCsvRow = screen.getByLabelText('Export monthly schedule as CSV');
    await fireEvent.press(exportCsvRow);

    expect(shareSpy).toHaveBeenCalled();
    const calls = shareSpy.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.message).toContain(
      'Date,Name,Start,End,BreakMinutes,NetHours,Origin,Notes',
    );
  });

  it('exports full backup as JSON when pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const exportJsonRow = screen.getByLabelText('Export full backup as JSON');
    await fireEvent.press(exportJsonRow);

    expect(shareSpy).toHaveBeenCalled();
    const calls = shareSpy.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall?.[0]?.title).toBe('myshift-backup.json');
    expect(lastCall?.[0]?.message).toContain('"version": 1');
  });

  it('opens restore backup sheet when restore row is pressed', async () => {
    await renderWithProviders(<SettingsScreen />);

    const restoreRow = screen.getByLabelText('Restore schedule from JSON backup');
    await fireEvent.press(restoreRow);

    expect(screen.getAllByText('Restore from Backup')).toHaveLength(2);
    expect(screen.getByLabelText('JSON backup payload input')).toBeTruthy();
  });
});
