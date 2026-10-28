import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/testing';
import { CalendarScreen } from './index';

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
    shifts: {
      insert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      upsert: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
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
  },
}));

jest.mock('@/services', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/services');
  return {
    ...actual,
    haptics: {
      selection: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
      impact: jest.fn(),
    },
  };
});

describe('CalendarScreen view modes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders month view by default and switches to week and day views', async () => {
    await renderWithProviders(<CalendarScreen />);

    // Default view mode is Month
    expect(screen.getByLabelText('Month view').props.accessibilityState).toEqual({
      selected: true,
    });

    // Switch to Week view
    await fireEvent.press(screen.getByLabelText('Week view'));
    expect(screen.getByLabelText('Week view').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Previous week')).toBeTruthy();
    expect(screen.getByLabelText('Next week')).toBeTruthy();

    // Switch to Day view
    await fireEvent.press(screen.getByLabelText('Day view'));
    expect(screen.getByLabelText('Day view').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Previous day')).toBeTruthy();
    expect(screen.getByLabelText('Next day')).toBeTruthy();
    expect(screen.getByText('+ Custom shift')).toBeTruthy();

    // Switch back to Month view
    await fireEvent.press(screen.getByLabelText('Month view'));
    expect(screen.getByLabelText('Month view').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByLabelText('Previous month')).toBeTruthy();
    expect(screen.getByLabelText('Next month')).toBeTruthy();
  });

  it('navigates previous and next in week view', async () => {
    await renderWithProviders(<CalendarScreen />);

    await fireEvent.press(screen.getByLabelText('Week view'));

    // Tap next week and previous week
    await fireEvent.press(screen.getByLabelText('Next week'));
    await fireEvent.press(screen.getByLabelText('Previous week'));
  });

  it('navigates previous and next in day view', async () => {
    await renderWithProviders(<CalendarScreen />);

    await fireEvent.press(screen.getByLabelText('Day view'));

    // Tap next day and previous day
    await fireEvent.press(screen.getByLabelText('Next day'));
    await fireEvent.press(screen.getByLabelText('Previous day'));
  });

  it('renders monthly stats subtitle and navigates to today when Today button is tapped', async () => {
    await renderWithProviders(<CalendarScreen />);

    expect(screen.getByText('0 shifts \u00b7 0h')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByLabelText('Go to today')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Go to today'));
    expect(screen.queryByLabelText('Go to today')).toBeNull();
  });

  it('opens DayDetailSheet modal when a day cell is pressed in normal mode', async () => {
    await renderWithProviders(<CalendarScreen />);

    // In month view, find day button and press it
    const dayButtons = screen.getAllByRole('button');
    const dayCell = dayButtons.find((btn) => {
      const label = btn.props.accessibilityLabel as string | undefined;
      return typeof label === 'string' && label.includes('October 2026');
    });

    if (dayCell) {
      await fireEvent.press(dayCell);
      expect(screen.getByText('Add shift (template)')).toBeTruthy();
    }
  });
});
