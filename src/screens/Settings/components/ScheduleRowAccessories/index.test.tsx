import { screen } from '@testing-library/react-native';
import { RotationPreviewAccessory, TemplatePreviewAccessory } from './index';
import { renderWithProviders } from '@/testing';
import { useRotationStore, useTemplateStore } from '@/store';
import type { ShiftTemplate } from '@/domain';

describe('ScheduleRowAccessories', () => {
  const dummyTemplate: ShiftTemplate = {
    id: 'tpl-1',
    name: 'Day',
    color: '#5B7DB1',
    icon: 'sun',
    startTime: '07:00',
    endTime: '15:30',
    breakMinutes: 30,
    hourlyRate: null,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  beforeEach(() => {
    useTemplateStore.setState({
      templates: [dummyTemplate],
      status: 'ready',
      error: null,
    });
    useRotationStore.setState({
      rotations: [
        {
          id: 'rot-1',
          name: '4-on-2-off',
          anchorDate: '2026-01-01',
          startDate: '2026-01-01',
          endDate: null,
          active: true,
          pattern: ['tpl-1', null],
        },
      ],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });
  });

  it('renders TemplatePreviewAccessory with active count', async () => {
    await renderWithProviders(<TemplatePreviewAccessory />);
    expect(screen.getByText('1 active')).toBeTruthy();
  });

  it('renders RotationPreviewAccessory with shift count', async () => {
    await renderWithProviders(<RotationPreviewAccessory />);
    expect(screen.getByText('2 shifts')).toBeTruthy();
  });

  it('renders RotationPreviewAccessory with "None" when no active rotation', async () => {
    useRotationStore.setState({
      rotations: [],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });
    await renderWithProviders(<RotationPreviewAccessory />);
    expect(screen.getByText('None')).toBeTruthy();
  });
});
