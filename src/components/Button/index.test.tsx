import { fireEvent, screen } from '@testing-library/react-native';
import { Button } from './index';
import { renderWithProviders } from '@/testing';

describe('Button', () => {
  it('renders label and triggers onPress when clicked', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save Changes" onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Save Changes' });
    expect(button).toBeTruthy();

    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Submit" disabled={true} onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
