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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      settings: initialSettings,
      status: 'ready',
      error: null,
    });
    jest.spyOn(expoPermissionChecker, 'getPermissionStatus').mockResolvedValue('granted');
  });

  it('renders title and back button', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('Reminder Settings')).toBeTruthy();
    expect(screen.getByLabelText('Go back')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders active reminder intervals formatted with formatTimeUntil', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('1 hour before')).toBeTruthy();
    expect(screen.getByText('30 minutes before')).toBeTruthy();
    expect(screen.getByText('15 minutes before')).toBeTruthy();
  });

  it('toggles global remindersEnabled switch', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const switchToggle = screen.getByLabelText('Enable Shift Reminders');
    expect(switchToggle).toBeTruthy();

    await fireEvent(switchToggle, 'valueChange', false);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.remindersEnabled).toBe(false);
  });

  it('removes an active reminder interval', async () => {
    await renderWithProviders(<ReminderSettingsScreen />);

    const removeBtn = screen.getByLabelText('Remove 1 hour reminder');
    expect(removeBtn).toBeTruthy();

    await fireEvent.press(removeBtn);

    const updated = useSettingsStore.getState().settings;
    expect(updated?.defaultMinutesBefore).toEqual([30, 15]);
  });

  it('adds a quick-add reminder preset', async () => {
    useSettingsStore.setState({
      settings: {
        ...initialSettings,
        defaultMinutesBefore: [60],
      },
      status: 'ready',
      error: null,
    });

    await renderWithProviders(<ReminderSettingsScreen />);

    const add30m = screen.getByLabelText('Add 30 minutes reminder');
    expect(add30m).toBeTruthy();

    await fireEvent.press(add30m);

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

  it('shows permission banner when notifications are not granted', async () => {
    jest.spyOn(expoPermissionChecker, 'getPermissionStatus').mockResolvedValue('denied');

    await renderWithProviders(<ReminderSettingsScreen />);

    expect(screen.getByText('Notifications Disabled')).toBeTruthy();
    expect(screen.getByLabelText('Enable Notifications')).toBeTruthy();
  });
});
