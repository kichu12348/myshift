import { fireEvent, screen } from '@testing-library/react-native';
import type { ShiftTemplate } from '@/domain';
import { renderWithProviders } from '@/testing';
import { FloatingStampBar } from './index';

const mockTemplates: ShiftTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startTime: '07:00',
    endTime: '15:00',
    breakMinutes: 30,
    hourlyRate: 35,
    reminderOverride: [60],
    archivedAt: null,
  },
  {
    id: 'tpl-2',
    name: 'Night',
    icon: 'moon',
    color: '#5B7DB1',
    isOff: false,
    startTime: '23:00',
    endTime: '07:00',
    breakMinutes: 30,
    hourlyRate: 45,
    reminderOverride: [30],
    archivedAt: null,
  },
];

describe('FloatingStampBar', () => {
  it('renders status label with currently active painting template', async () => {
    await renderWithProviders(
      <FloatingStampBar
        activeTemplateId="tpl-1"
        templates={mockTemplates}
        onSelectTemplate={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Painting: Day')).toBeTruthy();
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Night')).toBeTruthy();
  });

  it('calls onSelectTemplate when a template chip is pressed', async () => {
    const onSelectTemplateMock = jest.fn();

    await renderWithProviders(
      <FloatingStampBar
        activeTemplateId="tpl-1"
        templates={mockTemplates}
        onSelectTemplate={onSelectTemplateMock}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Select Night for painting'));
    expect(onSelectTemplateMock).toHaveBeenCalledTimes(1);
    expect(onSelectTemplateMock).toHaveBeenCalledWith('tpl-2');
  });

  it('calls onClose when Done button is pressed', async () => {
    const onCloseMock = jest.fn();

    await renderWithProviders(
      <FloatingStampBar
        activeTemplateId="tpl-1"
        templates={mockTemplates}
        onSelectTemplate={jest.fn()}
        onClose={onCloseMock}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Done painting shifts'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
