import { fireEvent, screen } from '@testing-library/react-native';
import type { LocalDate, ResolvedShift, ShiftTemplate } from '@/domain';
import { haptics } from '@/services';
import { useTemplateStore } from '@/store';
import { renderWithProviders } from '@/testing';
import { DayView } from './index';

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

describe('DayView', () => {
  const selectedDate: LocalDate = '2026-10-21';
  const today: LocalDate = '2026-10-21';

  const mockShift: ResolvedShift = {
    id: 'shift-1',
    date: selectedDate,
    templateId: 't1',
    name: 'Day Shift',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: new Date(2026, 9, 21, 7, 0).getTime(),
    endsAt: new Date(2026, 9, 21, 19, 0).getTime(),
    breakMinutes: 30,
    notes: 'Floor duty in ward A',
    rotationId: null,
    reminderOverride: null,
    origin: 'manual',
  };

  const mockTemplate: ShiftTemplate = {
    id: 't-day',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    hourlyRate: 35,
    reminderOverride: null,
    archivedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTemplateStore.setState({
      templates: [mockTemplate],
      status: 'idle',
      error: null,
    });
  });

  it('renders horizontal week strip and selects a different day', async () => {
    const onSelectDate = jest.fn();
    await renderWithProviders(
      <DayView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        shifts={[mockShift]}
        onSelectDate={onSelectDate}
        onEditShift={jest.fn()}
        onCustomShift={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Thursday, 22 October 2026'));

    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onSelectDate).toHaveBeenCalledWith('2026-10-22');
  });

  it('renders full shift details: pill, origin, times, duration, break, notes', async () => {
    const onEditShift = jest.fn();
    await renderWithProviders(
      <DayView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        shifts={[mockShift]}
        onSelectDate={jest.fn()}
        onEditShift={onEditShift}
        onCustomShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Day Shift')).toBeTruthy();
    expect(screen.getByText('Manual')).toBeTruthy();
    expect(screen.getByText('07:00 \u2013 19:00')).toBeTruthy();
    // 12 hours gross - 30m break = 11h 30m net
    expect(screen.getByText(' \u2022 11h 30m')).toBeTruthy();
    expect(screen.getByText(' \u2022 30m break')).toBeTruthy();
    expect(screen.getByText('Floor duty in ward A')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Edit Day Shift'));
    expect(onEditShift).toHaveBeenCalledWith(mockShift);
  });

  it('renders empty message when no shifts', async () => {
    await renderWithProviders(
      <DayView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        shifts={[]}
        onSelectDate={jest.fn()}
        onEditShift={jest.fn()}
        onCustomShift={jest.fn()}
      />,
    );

    expect(screen.getByText('No shifts scheduled for this day')).toBeTruthy();
  });

  it('triggers quick-add template and custom shift button', async () => {
    const onAddShiftFromTemplate = jest.fn();
    const onCustomShift = jest.fn();

    await renderWithProviders(
      <DayView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        shifts={[]}
        onSelectDate={jest.fn()}
        onEditShift={jest.fn()}
        onCustomShift={onCustomShift}
        onAddShiftFromTemplate={onAddShiftFromTemplate}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Add Day shift'));
    expect(haptics.success).toHaveBeenCalledTimes(1);
    expect(onAddShiftFromTemplate).toHaveBeenCalledWith(mockTemplate);

    await fireEvent.press(screen.getByLabelText('Create custom shift'));
    expect(onCustomShift).toHaveBeenCalledTimes(1);
  });
});
