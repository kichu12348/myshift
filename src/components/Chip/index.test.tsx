import { fireEvent, screen } from '@testing-library/react-native';
import { Chip } from './index';
import { renderWithProviders } from '@/testing';

describe('Chip', () => {
  it('renders label and handles press', async () => {
    const onPressMock = jest.fn();

    await renderWithProviders(
      <Chip label="Night" onPress={onPressMock} />,
    );

    expect(screen.getByText('Night')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Night' }));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with icon and color indicator', async () => {
    const onPressMock = jest.fn();

    await renderWithProviders(
      <Chip
        label="Day"
        iconName="sun"
        color="#F59E0B"
        selected={true}
        onPress={onPressMock}
      />,
    );

    const button = screen.getByRole('button', { name: 'Day' });
    expect(button).toBeTruthy();
    expect(button.props.accessibilityState).toEqual({
      selected: true,
      disabled: false,
    });
  });

  it('does not trigger onPress when disabled', async () => {
    const onPressMock = jest.fn();

    await renderWithProviders(
      <Chip
        label="Disabled"
        disabled={true}
        onPress={onPressMock}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Disabled' }));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
