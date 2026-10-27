import { screen } from '@testing-library/react-native';
import { ShiftPill } from './index';
import { renderWithProviders } from '@/testing';

function extractColor(style: unknown): string | undefined {
  if (Array.isArray(style)) {
    for (let i = style.length - 1; i >= 0; i--) {
      const found = extractColor(style[i]);
      if (found !== undefined) {
        return found;
      }
    }
  } else if (typeof style === 'object' && style !== null && 'color' in style) {
    const val = (style as { color?: unknown }).color;
    if (typeof val === 'string') {
      return val;
    }
  }
  return undefined;
}

describe('ShiftPill', () => {
  it('renders a working shift pill with name and without overnight marker', async () => {
    await renderWithProviders(<ShiftPill name="Day" icon="sun" color="#F59E0B" isOff={false} />);

    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.queryByText('+1')).toBeNull();
  });

  it('renders the +1 overnight marker when isOvernight is true', async () => {
    await renderWithProviders(
      <ShiftPill name="Night" icon="moon" color="#5B7DB1" isOff={false} isOvernight={true} />,
    );

    expect(screen.getByText('Night')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByLabelText('Night, overnight')).toBeTruthy();
  });

  it('renders an Off shift with muted style and without overnight marker', async () => {
    await renderWithProviders(
      <ShiftPill name="Off" icon="coffee" color="#94A3B8" isOff={true} isOvernight={true} />,
    );

    expect(screen.getByText('Off')).toBeTruthy();
    expect(screen.queryByText('+1')).toBeNull();
    expect(screen.getByLabelText('Off, Off')).toBeTruthy();
  });

  it('falls back to default icon when given an unknown icon name', async () => {
    await renderWithProviders(
      <ShiftPill name="Custom" icon="non-existent-icon" color="#10B981" isOff={false} />,
    );

    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders from a shift object and applies resolved color to text', async () => {
    const customShift = {
      id: 'shift-1',
      date: '2026-10-24' as const,
      templateId: null,
      name: 'Custom Day',
      icon: 'sun',
      color: '#123456',
      isOff: false,
      startsAt: 1000,
      endsAt: 2000,
      breakMinutes: 0,
      notes: '',
      origin: 'manual' as const,
      rotationId: null,
      reminderOverride: null,
    };

    await renderWithProviders(<ShiftPill shift={customShift} variant="full" />);

    const label = screen.getByText('Custom Day');
    expect(label).toBeTruthy();
    expect(extractColor(label.props.style)).toBe('#123456');
  });

  it('renders smart short label for long names in compact mode without ellipsis dots', async () => {
    await renderWithProviders(
      <ShiftPill name="Evening" icon="moon" color="#F97316" isOff={false} variant="compact" />,
    );

    expect(screen.getByText('Even')).toBeTruthy();
    expect(screen.queryByText('Evening')).toBeNull();
    expect(screen.queryByText(/Even\.\./)).toBeNull();
  });

  it('renders full label for names longer than 5 chars in full mode', async () => {
    await renderWithProviders(
      <ShiftPill name="Evening" icon="moon" color="#F97316" isOff={false} variant="full" />,
    );

    expect(screen.getByText('Evening')).toBeTruthy();
  });
});
