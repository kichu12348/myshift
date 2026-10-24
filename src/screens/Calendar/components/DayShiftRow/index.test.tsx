import { fireEvent, screen } from '@testing-library/react-native';
import { DayShiftRow } from './index';
import { renderWithProviders } from '@/testing';
import type { ResolvedShift } from '@/domain';
import { useRotationStore, useShiftStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      delete: jest.fn().mockResolvedValue(undefined),
      getByRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      upsert: jest.fn().mockResolvedValue(undefined),
      getByRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
  },
}));

function createTestShift(overrides?: Partial<ResolvedShift>): ResolvedShift {
  return {
    id: 'shift-1',
    date: '2026-10-24',
    templateId: 'tpl-1',
    name: 'Day Shift',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
    endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
    breakMinutes: 30,
    notes: 'Floor duty',
    origin: 'manual',
    rotationId: null,
    reminderOverride: null,
    ...overrides,
  };
}

describe('DayShiftRow', () => {
  it('renders shift details and triggers copy on long press', async () => {
    const shift = createTestShift();
    const onCopyMock = jest.fn();

    await renderWithProviders(<DayShiftRow shift={shift} timeFormat="24h" onCopy={onCopyMock} />);

    expect(screen.getByText('Day Shift')).toBeTruthy();
    expect(screen.getByText('07:00 \u2013 19:00')).toBeTruthy();
    expect(screen.getByText(' \u2022 30m break')).toBeTruthy();

    await fireEvent(screen.getByLabelText('Day Shift, 07:00 \u2013 19:00'), 'longPress');
    expect(onCopyMock).toHaveBeenCalledWith(shift);
  });

  it('renders rotation badge for rotation origin shifts', async () => {
    const shift = createTestShift({
      origin: 'rotation',
      rotationId: 'rot-1',
    });

    await renderWithProviders(<DayShiftRow shift={shift} timeFormat="24h" onCopy={jest.fn()} />);

    expect(screen.getByText('Rotation')).toBeTruthy();
  });

  it('enters inline confirmation and deletes manual shift when confirmed', async () => {
    const shift = createTestShift();
    const deleteShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'deleteShift')
      .mockImplementation(async () => {});

    await renderWithProviders(<DayShiftRow shift={shift} timeFormat="24h" onCopy={jest.fn()} />);

    // Initial state: trash button visible
    const deleteButton = screen.getByLabelText('Delete Day Shift');
    await fireEvent.press(deleteButton);

    // Confirmation state
    expect(screen.getByText('Delete this shift?')).toBeTruthy();
    const confirmButton = screen.getByLabelText('Confirm delete Day Shift');
    await fireEvent.press(confirmButton);

    expect(deleteShiftSpy).toHaveBeenCalledWith('shift-1');
    deleteShiftSpy.mockRestore();
  });

  it('cancels deletion when Cancel button is tapped in confirmation state', async () => {
    const shift = createTestShift();

    await renderWithProviders(<DayShiftRow shift={shift} timeFormat="24h" onCopy={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText('Delete Day Shift'));
    expect(screen.getByText('Delete this shift?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Cancel delete'));
    expect(screen.queryByText('Delete this shift?')).toBeNull();
    expect(screen.getByLabelText('Delete Day Shift')).toBeTruthy();
  });

  it('creates skip exception when deleting rotation shift', async () => {
    const shift = createTestShift({
      origin: 'rotation',
      rotationId: 'rot-123',
    });
    const upsertExceptionSpy = jest
      .spyOn(useRotationStore.getState(), 'upsertException')
      .mockImplementation(async () => {});

    await renderWithProviders(<DayShiftRow shift={shift} timeFormat="24h" onCopy={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText('Delete Day Shift'));
    expect(screen.getByText('Remove rotation shift for this day?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Confirm delete Day Shift'));
    expect(upsertExceptionSpy).toHaveBeenCalledWith({
      rotationId: 'rot-123',
      date: '2026-10-24',
      kind: 'skip',
      templateId: null,
    });

    upsertExceptionSpy.mockRestore();
  });
});
