import { screen } from '@testing-library/react-native';
import { ShiftPill } from './index';
import { renderWithProviders } from '@/testing';

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
});
