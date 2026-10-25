import { fireEvent, screen } from '@testing-library/react-native';
import { Switch } from './index';
import { renderWithProviders } from '@/testing';
import { haptics } from '@/services';

describe('Switch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders switch with accessibility attributes and triggers onValueChange on press', async () => {
    const onValueChange = jest.fn();
    const hapticsSpy = jest.spyOn(haptics, 'selection');

    await renderWithProviders(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Test switch" />,
    );

    const switchElement = screen.getByLabelText('Test switch');
    expect(switchElement).toBeTruthy();
    expect(switchElement.props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });

    await fireEvent.press(switchElement);
    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(hapticsSpy).toHaveBeenCalledTimes(1);
  });

  it('handles valueChange event for backwards compatibility', async () => {
    const onValueChange = jest.fn();
    await renderWithProviders(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Test switch" />,
    );

    const switchElement = screen.getByLabelText('Test switch');
    await fireEvent(switchElement, 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('renders checked state correctly and does not fire when disabled', async () => {
    const onValueChange = jest.fn();
    await renderWithProviders(
      <Switch value={true} onValueChange={onValueChange} accessibilityLabel="Checked switch" disabled />,
    );

    const switchElement = screen.getByLabelText('Checked switch');
    expect(switchElement.props.accessibilityState).toEqual({
      checked: true,
      disabled: true,
    });

    await fireEvent.press(switchElement);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
