import { fireEvent, screen } from '@testing-library/react-native';
import { DockedDayPanel } from './index';
import { renderWithProviders } from '@/testing';
import type { ResolvedShift, ShiftTemplate } from '@/domain';
import { useTemplateStore } from '@/store';

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
  notes: 'ICU ward',
  origin: 'manual',
  rotationId: null,
  reminderOverride: [30],
};

describe('DockedDayPanel Component', () => {
  beforeEach(() => {
    useTemplateStore.setState({
      templates: [mockTemplate],
      status: 'ready',
      error: null,
    });
  });

  it('renders selected date and empty state message when no shifts are scheduled', async () => {
    await renderWithProviders(
      <DockedDayPanel
        date="2026-10-24"
        shifts={[]}
        timeFormat="24h"
        activeStampTemplateId={null}
        onToggleStampBrush={jest.fn()}
        onClearStampBrush={jest.fn()}
        onEditDate={jest.fn()}
        onDeleteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Sat, 24 Oct')).toBeTruthy();
    expect(screen.getByText('+ Custom')).toBeTruthy();
    expect(
      screen.getByText('No shifts scheduled \u2014 tap a template below to add'),
    ).toBeTruthy();
  });

  it('renders shift details with name, net duration, notes, and triggers delete', async () => {
    const onDeleteMock = jest.fn();

    await renderWithProviders(
      <DockedDayPanel
        date="2026-10-24"
        shifts={[mockShift]}
        timeFormat="24h"
        activeStampTemplateId={null}
        onToggleStampBrush={jest.fn()}
        onClearStampBrush={jest.fn()}
        onEditDate={jest.fn()}
        onDeleteShift={onDeleteMock}
      />,
    );

    expect(screen.getByText('Night Shift')).toBeTruthy();
    expect(screen.getByText('ICU ward')).toBeTruthy();
    expect(screen.getByText('30m')).toBeTruthy();

    const deleteBtn = screen.getByLabelText('Delete Night Shift shift');
    await fireEvent.press(deleteBtn);
    expect(onDeleteMock).toHaveBeenCalledWith(mockShift);
  });

  it('toggles stamp brush when template button is pressed', async () => {
    const onToggleMock = jest.fn();

    await renderWithProviders(
      <DockedDayPanel
        date="2026-10-24"
        shifts={[]}
        timeFormat="24h"
        activeStampTemplateId={null}
        onToggleStampBrush={onToggleMock}
        onClearStampBrush={jest.fn()}
        onEditDate={jest.fn()}
        onDeleteShift={jest.fn()}
      />,
    );

    const stampBtn = screen.getByLabelText('Stamp Night template');
    await fireEvent.press(stampBtn);
    expect(onToggleMock).toHaveBeenCalledWith(mockTemplate);
  });

  it('renders active stamp indicator and triggers clear when pressed', async () => {
    const onClearMock = jest.fn();

    await renderWithProviders(
      <DockedDayPanel
        date="2026-10-24"
        shifts={[]}
        timeFormat="24h"
        activeStampTemplateId="tpl-night"
        onToggleStampBrush={jest.fn()}
        onClearStampBrush={onClearMock}
        onEditDate={jest.fn()}
        onDeleteShift={jest.fn()}
      />,
    );

    expect(screen.getByText('Stamp Mode: ON (tap days) \u2715')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Turn off stamp mode'));
    expect(onClearMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onEditDate when header action pill is pressed', async () => {
    const onEditMock = jest.fn();

    await renderWithProviders(
      <DockedDayPanel
        date="2026-10-24"
        shifts={[mockShift]}
        timeFormat="24h"
        activeStampTemplateId={null}
        onToggleStampBrush={jest.fn()}
        onClearStampBrush={jest.fn()}
        onEditDate={onEditMock}
        onDeleteShift={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Edit shifts for Sat, 24 Oct'));
    expect(onEditMock).toHaveBeenCalledWith('2026-10-24');
  });
});
