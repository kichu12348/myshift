import { fireEvent, screen } from '@testing-library/react-native';
import type { LocalDate, ResolvedDay, ResolvedShift } from '@/domain';
import { haptics } from '@/services';
import { renderWithProviders } from '@/testing';
import { WeekView } from './index';

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

describe('WeekView', () => {
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
    notes: 'Floor duty',
    rotationId: null,
    reminderOverride: null,
    origin: 'manual',
  };

  const resolvedDays = new Map<LocalDate, ResolvedDay>([
    [
      selectedDate,
      {
        shifts: [mockShift],
        issues: [],
      },
    ],
  ]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 7 days of the week', async () => {
    await renderWithProviders(
      <WeekView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        resolvedDays={resolvedDays}
        copiedShift={null}
        onSelectDate={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Thu')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
    expect(screen.getByText('Sat')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();

    expect(screen.getByText('19')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
    expect(screen.getByText('22')).toBeTruthy();
    expect(screen.getByText('23')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();

    expect(screen.getAllByText('No shifts')).toHaveLength(6);
    expect(screen.getByText('Day Shift')).toBeTruthy();
    expect(screen.getByText('07:00 \u2013 19:00')).toBeTruthy();
  });

  it('selects date and triggers haptics on press', async () => {
    const onSelectDate = jest.fn();
    await renderWithProviders(
      <WeekView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        resolvedDays={resolvedDays}
        copiedShift={null}
        onSelectDate={onSelectDate}
        onPasteShift={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Tuesday, 20 October 2026, No shifts'));

    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onSelectDate).toHaveBeenCalledWith('2026-10-20');
  });

  it('pastes copied shift on long-press', async () => {
    const onPasteShift = jest.fn();
    await renderWithProviders(
      <WeekView
        selectedDate={selectedDate}
        today={today}
        weekStart={1}
        timeFormat="24h"
        resolvedDays={resolvedDays}
        copiedShift={mockShift}
        onSelectDate={jest.fn()}
        onPasteShift={onPasteShift}
      />,
    );

    await fireEvent(screen.getByLabelText('Friday, 23 October 2026, No shifts'), 'longPress');

    expect(onPasteShift).toHaveBeenCalledWith('2026-10-23');
  });
});
