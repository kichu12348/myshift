import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { StatsScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { Shift, ShiftTemplate } from '@/domain';
import { repositories } from '@/db';
import { useTemplateStore } from '@/store';

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
    shifts: {
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (repositories.shifts.getByDateRange as jest.Mock).mockResolvedValue([]);
    (repositories.rotationExceptions.getByDateRange as jest.Mock).mockResolvedValue([]);
  });

  it('renders initial empty monthly stats and navigates to TemplateList on button press', async () => {
    await renderWithProviders(<StatsScreen />);

    // Check header
    expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(1);

    // Check empty metrics
    expect(screen.getByText('Net Hours')).toBeTruthy();
    expect(screen.getByText('0h')).toBeTruthy();
    expect(screen.getByText('Working Shifts')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('No break deductions')).toBeTruthy();
    expect(screen.getByText('0 off days')).toBeTruthy();

    // Check no earnings caption and button
    expect(screen.getByText('Set hourly rates in Templates to track pay')).toBeTruthy();
    const manageButton = screen.getByLabelText('Manage templates to set hourly rate');
    expect(manageButton).toBeTruthy();

    // Press manage templates
    await fireEvent.press(manageButton);
    expect(mockNavigate).toHaveBeenCalledWith(ROOT_ROUTES.TEMPLATE_LIST);

    // Check empty breakdown state
    expect(screen.getByText(/No shifts scheduled in/)).toBeTruthy();
  });

  it('navigates between months and shows Today button when away from current month', async () => {
    await renderWithProviders(<StatsScreen />);

    const nextButton = screen.getByLabelText('Next month');
    await fireEvent.press(nextButton);

    // Today button should now appear
    const todayButton = screen.getByLabelText('Go to today');
    expect(todayButton).toBeTruthy();

    // Jump back to today
    await fireEvent.press(todayButton);
    expect(screen.queryByLabelText('Go to today')).toBeNull();

    // Navigate to previous month
    const prevButton = screen.getByLabelText('Previous month');
    await fireEvent.press(prevButton);
    expect(screen.getByLabelText('Go to today')).toBeTruthy();
  });

  it('renders aggregated working hours, breaks, and shift breakdown with earnings', async () => {
    const dayTemplate: ShiftTemplate = {
      id: 'tpl-day',
      name: 'Day',
      icon: 'sun',
      color: '#F59E0B',
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      hourlyRate: 40,
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

    useTemplateStore.setState({
      templates: [dayTemplate, offTemplate],
      status: 'ready',
    });

    const mockShifts: Shift[] = [
      {
        id: 'shift-1',
        date: '2026-10-05',
        templateId: 'tpl-day',
        name: 'Day',
        icon: 'sun',
        color: '#F59E0B',
        isOff: false,
        startsAt: new Date('2026-10-05T07:00:00Z').getTime(),
        endsAt: new Date('2026-10-05T19:00:00Z').getTime(),
        breakMinutes: 30,
        notes: '',
        source: 'manual',
        rotationId: null,
        reminderOverride: null,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'shift-2',
        date: '2026-10-06',
        templateId: 'tpl-off',
        name: 'Off',
        icon: 'coffee',
        color: '#94A3B8',
        isOff: true,
        startsAt: new Date('2026-10-06T00:00:00Z').getTime(),
        endsAt: new Date('2026-10-06T00:00:00Z').getTime(),
        breakMinutes: 0,
        notes: '',
        source: 'manual',
        rotationId: null,
        reminderOverride: null,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    (repositories.shifts.getByDateRange as jest.Mock).mockResolvedValue(mockShifts);

    await renderWithProviders(<StatsScreen />);

    // Wait for async load of shifts
    await waitFor(() => {
      expect(screen.getAllByText('11h 30m')).toHaveLength(2);
    });

    // Check overview
    expect(screen.getByText('1')).toBeTruthy(); // 1 working shift
    expect(screen.getByText('30m break deducted')).toBeTruthy();
    expect(screen.getByText('1 off day')).toBeTruthy();

    // Check estimated earnings: 11.5h * $40 = $460.00 (both in overview card and in breakdown list)
    expect(screen.getAllByText('$460.00')).toHaveLength(2);
    expect(screen.getByText('Estimated before taxes & deductions')).toBeTruthy();

    // Check breakdown list items
    expect(screen.getByText('Shift Breakdown')).toBeTruthy();
    expect(screen.getAllByText('1 shift')).toHaveLength(2);
    expect(screen.getByLabelText('Day')).toBeTruthy();
    expect(screen.getByLabelText('Off, Off')).toBeTruthy();
  });
});
