import { fireEvent, screen } from '@testing-library/react-native';
import { DayDetailSheet } from './index';
import { renderWithProviders } from '@/testing';
import type { ResolvedShift, Shift, ShiftTemplate } from '@/domain';
import { useRotationStore, useShiftStore, useTemplateStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      insert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
      getByRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      upsert: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
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

const mockTemplate: ShiftTemplate = {
  id: 'tpl-night',
  name: 'Night',
  icon: 'moon',
  color: '#5B7DB1',
  startTime: '19:00',
  endTime: '07:00',
  breakMinutes: 45,
  hourlyRate: null,
  isOff: false,
  reminderOverride: null,
  archivedAt: null,
};

const mockShift: ResolvedShift = {
  id: 'shift-1',
  date: '2026-10-24',
  templateId: 'tpl-night',
  name: 'Night Shift',
  icon: 'moon',
  color: '#5B7DB1',
  isOff: false,
  startsAt: new Date(2026, 9, 24, 19, 0).getTime(),
  endsAt: new Date(2026, 9, 25, 7, 0).getTime(),
  breakMinutes: 45,
  notes: '',
  origin: 'manual',
  rotationId: null,
  reminderOverride: null,
};

describe('DayDetailSheet', () => {
  beforeEach(() => {
    useTemplateStore.setState({
      templates: [mockTemplate],
      status: 'ready',
      error: null,
    });
  });

  it('renders date header and empty state message when no shifts scheduled', async () => {
    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={null}
        timeFormat="24h"
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Sat, 24 Oct')).toBeTruthy();
    expect(screen.getByText('No shifts scheduled for this day')).toBeTruthy();
  });

  it('renders scheduled shifts in the list and triggers onEditShift on Edit button press', async () => {
    const onEditMock = jest.fn();

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[mockShift]}
        copiedShift={null}
        timeFormat="24h"
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
        onEditShift={onEditMock}
      />,
    );

    expect(screen.getByText('Night Shift')).toBeTruthy();
    expect(screen.queryByText('No shifts scheduled for this day')).toBeNull();

    const editBtn = screen.getByLabelText('Edit shift');
    await fireEvent.press(editBtn);
    expect(onEditMock).toHaveBeenCalledWith(mockShift);
  });

  it('renders painting mode indicator and clears painting mode on press', async () => {
    const onClearPaintMock = jest.fn();

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={null}
        timeFormat="24h"
        paintingTemplate={mockTemplate}
        onClearPaintMode={onClearPaintMock}
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Painting: Night \u2715')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Stop painting Night'));
    expect(onClearPaintMock).toHaveBeenCalledTimes(1);
  });

  it('quick-adds shift when template chip is pressed', async () => {
    const createdShift: Shift = {
      ...mockShift,
      source: 'manual',
      createdAt: 1000,
      updatedAt: 1000,
    };
    const createShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'createShift')
      .mockResolvedValue(createdShift);

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={null}
        timeFormat="24h"
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    const quickAddChip = screen.getByLabelText('Add Night shift');
    await fireEvent.press(quickAddChip);

    expect(createShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-24',
        name: 'Night',
        templateId: 'tpl-night',
        source: 'manual',
      }),
    );

    createShiftSpy.mockRestore();
  });

  it('shows paste action button when copiedShift is provided and triggers onPasteShift', async () => {
    const onPasteMock = jest.fn();

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={mockShift}
        timeFormat="24h"
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={onPasteMock}
      />,
    );

    expect(screen.getByText('Copied: Night Shift')).toBeTruthy();
    const pasteButton = screen.getByLabelText('Paste Night Shift to this day');
    await fireEvent.press(pasteButton);

    expect(onPasteMock).toHaveBeenCalledWith('2026-10-24');
  });

  it('calls onClose when close icon button is pressed', async () => {
    const onCloseMock = jest.fn();

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={null}
        timeFormat="24h"
        onClose={onCloseMock}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Close day details'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('displays rotation exception notice and calls deleteException when restore is pressed', async () => {
    useRotationStore.setState({
      exceptions: [
        {
          rotationId: 'rot-1',
          date: '2026-10-24',
          kind: 'replace',
          templateId: 'tpl-night',
        },
      ],
      rotations: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const deleteExceptionSpy = jest
      .spyOn(useRotationStore.getState(), 'deleteException')
      .mockResolvedValue(undefined);

    await renderWithProviders(
      <DayDetailSheet
        visible={true}
        date="2026-10-24"
        shifts={[]}
        copiedShift={null}
        timeFormat="24h"
        onClose={jest.fn()}
        onCopyShift={jest.fn()}
        onPasteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Rotation shift replaced on this day')).toBeTruthy();
    const restoreBtn = screen.getByLabelText('Restore rotation default');
    await fireEvent.press(restoreBtn);

    expect(deleteExceptionSpy).toHaveBeenCalledWith('rot-1', '2026-10-24');
    deleteExceptionSpy.mockRestore();
  });
});
