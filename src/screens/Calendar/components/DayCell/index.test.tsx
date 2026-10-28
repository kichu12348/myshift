import { fireEvent, screen } from '@testing-library/react-native';
import { DayCell } from './index';
import { renderWithProviders } from '@/testing';
import { getShiftTimes, type LocalDate, type ResolvedShift } from '@/domain';
import { formatLongDate } from '@/utils';

function createMockShift(
  id: string,
  name: string,
  isOvernight: boolean = false,
  date: LocalDate = '2026-10-24',
): ResolvedShift {
  const times = isOvernight
    ? getShiftTimes(date, '19:00', '07:00')
    : getShiftTimes(date, '07:00', '15:00');

  return {
    id,
    date,
    templateId: `tpl-${id}`,
    name,
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    breakMinutes: 30,
    notes: '',
    origin: 'manual',
    rotationId: null,
    reminderOverride: null,
  };
}

describe('DayCell', () => {
  const defaultDate: LocalDate = '2026-10-24';
  const noop = (): void => {};

  it('renders day number and base accessibility label when shifts is empty', async () => {
    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={false}
        isSelected={false}
        isWeekend={false}
        shifts={[]}
        onPress={noop}
      />,
    );

    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByLabelText(formatLongDate(defaultDate))).toBeTruthy();
  });

  it('renders up to 2 shifts without overflow text', async () => {
    const shifts: ResolvedShift[] = [createMockShift('1', 'Day'), createMockShift('2', 'Evening')];

    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={false}
        isSelected={false}
        isWeekend={false}
        shifts={shifts}
        onPress={noop}
      />,
    );

    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Evening')).toBeTruthy();
    expect(screen.getByLabelText('Evening')).toBeTruthy();
    expect(screen.queryByText(/^\+[0-9]+$/)).toBeNull();
  });

  it('renders 2 shift pills and +N overflow indicator when shifts > 2', async () => {
    const shifts: ResolvedShift[] = [
      createMockShift('1', 'Shift 1'),
      createMockShift('2', 'Shift 2'),
      createMockShift('3', 'Shift 3'),
      createMockShift('4', 'Shift 4'),
      createMockShift('5', 'Shift 5'),
    ];

    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={false}
        isSelected={false}
        isWeekend={false}
        shifts={shifts}
        onPress={noop}
      />,
    );

    expect(screen.getByText('Shift 1')).toBeTruthy();
    expect(screen.getByText('Shift 2')).toBeTruthy();
    expect(screen.getByLabelText('Shift 1')).toBeTruthy();
    expect(screen.getByLabelText('Shift 2')).toBeTruthy();
    expect(screen.queryByLabelText('Shift 3')).toBeNull();
    expect(screen.queryByLabelText('Shift 4')).toBeNull();
    expect(screen.queryByLabelText('Shift 5')).toBeNull();
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('includes shift names in accessibility label', async () => {
    const shifts: ResolvedShift[] = [
      createMockShift('1', 'Day'),
      createMockShift('2', 'Night', true),
    ];

    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={true}
        isSelected={false}
        isWeekend={false}
        shifts={shifts}
        onPress={noop}
      />,
    );

    expect(screen.getByLabelText(`${formatLongDate(defaultDate)}, Today, Day, Night`)).toBeTruthy();
  });

  it('calls onPress with date when pressed', async () => {
    const onPressMock = jest.fn();

    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={false}
        isSelected={false}
        isWeekend={false}
        shifts={[]}
        onPress={onPressMock}
      />,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(onPressMock).toHaveBeenCalledWith(defaultDate);
  });

  it('renders reminder and notes micro-indicators with shift color', async () => {
    const shiftWithReminder: ResolvedShift = {
      ...createMockShift('1', 'Day'),
      color: '#10B981',
      reminderOverride: [30],
      notes: 'Check inventory',
    };

    await renderWithProviders(
      <DayCell
        date={defaultDate}
        inMonth={true}
        isToday={false}
        isSelected={false}
        isWeekend={false}
        shifts={[shiftWithReminder]}
        onPress={noop}
      />,
    );

    expect(screen.getByText('Day')).toBeTruthy();
  });
});
