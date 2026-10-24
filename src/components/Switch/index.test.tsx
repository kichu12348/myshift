import { fireEvent, screen } from '@testing-library/react-native';
import { Switch } from './index';
import { renderWithProviders } from '@/testing';

describe('Switch', () => {
  it('renders switch with accessibility attributes and triggers onValueChange', async () => {
    const onValueChange = jest.fn();
    await renderWithProviders(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Test switch" />,
    );

    const switchElement = screen.getByLabelText('Test switch');
    expect(switchElement).toBeTruthy();
    expect(switchElement.props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });

    await fireEvent(switchElement, 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
