import { fireEvent, screen } from '@testing-library/react-native';
import { ReminderSettingsScreen } from './index';
import { renderWithProviders } from '@/testing';
import { useSettingsStore } from '@/store';
import { expoPermissionChecker } from '@/services';
import type { AppSettings } from '@/domain';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
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
      upsert: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn().mockResolvedValue(undefined),
      deleteByKey: jest.fn().mockResolvedValue(undefined),
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

describe('ReminderSettingsScreen', () => {
  const initialSettings: AppSettings = {
    themeMode: 'auto',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30, 15],
    onboardingCompleted: true,
    hapticsEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      settings: initialSettings,
      status: 'ready',
      error: null,
    });
    jest.spyOn(expoPermissionChecker, 'getPermissionStatus').mockResolvedValue('granted');
    jest.spyOn(expoPermissionChecker, 'requestPermission').mockResolvedValue('granted');
  });

  it('renders title, back button, and active status badge', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('Shift Reminders')).toBeTruthy();
    expect(screen.getByLabelText('Go back')).toBeTruthy();
    expect(screen.getByText('3 active')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders preset reminder options', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('15 minutes before')).toBeTruthy();
    expect(screen.getByText('30 minutes before')).toBeTruthy();
    expect(screen.getByText('1 hour before')).toBeTruthy();
    expect(screen.getByText('2 hours before')).toBeTruthy();
    expect(screen.getByText('12 hours before')).toBeTruthy();
    expect(screen.getByText('1 day before')).toBeTruthy();
  });

  it('toggles global remindersEnabled switch', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const switchToggle = screen.getByLabelText('Enable Shift Reminders');
    expect(switchToggle).toBeTruthy();

    await fireEvent(switchToggle, 'valueChange', false);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.remindersEnabled).toBe(false);
  });

  it('toggles a preset offset off when tapped', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const row1h = screen.getByLabelText('1 hour before');
    expect(row1h).toBeTruthy();

    await fireEvent.press(row1h);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.defaultMinutesBefore).toEqual([30, 15]);
  });

  it('toggles a preset offset on when tapped', async () => {
    useSettingsStore.setState({
      settings: {
        ...initialSettings,
        defaultMinutesBefore: [60],
      },
      status: 'ready',
      error: null,
    });

    await renderWithProviders(<ReminderSettingsScreen />);

    const row30m = screen.getByLabelText('30 minutes before');
    expect(row30m).toBeTruthy();

    await fireEvent.press(row30m);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.defaultMinutesBefore).toEqual([60, 30]);
  });

  it('validates and adds custom reminder offset', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const input = screen.getByLabelText('Custom reminder minutes input');
    await fireEvent.changeText(input, '45');

    const addBtn = screen.getByLabelText('Add custom reminder interval');
    await fireEvent.press(addBtn);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.defaultMinutesBefore).toContain(45);
  });

  it('removes custom reminder offset via remove button', async () => {
    useSettingsStore.setState({
      settings: {
        ...initialSettings,
        defaultMinutesBefore: [60, 45, 30],
      },
      status: 'ready',
      error: null,
    });

    await renderWithProviders(<ReminderSettingsScreen />);

    const removeBtn = screen.getByLabelText('Remove 45 minutes reminder');
    expect(removeBtn).toBeTruthy();

    await fireEvent.press(removeBtn);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.defaultMinutesBefore).toEqual([60, 30]);
  });

  it('formats large custom offsets like 9999 into readable time', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const input = screen.getByLabelText('Custom reminder minutes input');
    await fireEvent.changeText(input, '9999');

    // Live preview formatted text appears while typing
    expect(screen.getByText('6 days 22 hours 39 minutes before shift')).toBeTruthy();

    const addBtn = screen.getByLabelText('Add custom reminder interval');
    await fireEvent.press(addBtn);

    // Active row rendered with formatted title and compact badge
    expect(screen.getByText('6 days 22 hours 39 minutes before')).toBeTruthy();
    expect(screen.getByText('6d22h')).toBeTruthy();
  });

  it('shows permission banner when notifications are blocked by system', async () => {
    jest.spyOn(expoPermissionChecker, 'getPermissionStatus').mockResolvedValue('denied');
    const requestPermissionSpy = jest
      .spyOn(expoPermissionChecker, 'requestPermission')
      .mockResolvedValue('granted');

    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('Notifications blocked by system')).toBeTruthy();
    const enableBtn = screen.getByLabelText('Enable Notifications');
    expect(enableBtn).toBeTruthy();

    await fireEvent.press(enableBtn);
    expect(requestPermissionSpy).toHaveBeenCalled();
  });

  it('renders dynamic example preview for active offsets', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('Example: Day Shift (07:00)')).toBeTruthy();
    expect(screen.getByText('Alerts at 06:00, 06:30, 06:45')).toBeTruthy();
  });

  it('renders No alerts scheduled when reminders are disabled', async () => {
    useSettingsStore.setState({
      settings: {
        ...initialSettings,
        remindersEnabled: false,
      },
      status: 'ready',
      error: null,
    });

    await renderWithProviders(<ReminderSettingsScreen />);
    expect(screen.getByText('No alerts scheduled')).toBeTruthy();
  });
});
