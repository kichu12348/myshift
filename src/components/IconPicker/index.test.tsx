import { fireEvent, screen } from '@testing-library/react-native';
import { IconPicker } from './index';
import { renderWithProviders } from '@/testing';

describe('IconPicker', () => {
  it('renders all shift icons with accessibility labels and highlights selected icon', async () => {
    const onSelectIcon = jest.fn();

    await renderWithProviders(<IconPicker selectedIcon="moon" onSelectIcon={onSelectIcon} />);

    const moonButton = screen.getByLabelText('Icon moon');
    expect(moonButton).toBeTruthy();
    expect(moonButton.props.accessibilityState).toEqual({ selected: true });

    const sunButton = screen.getByLabelText('Icon sun');
    expect(sunButton).toBeTruthy();
    expect(sunButton.props.accessibilityState).toEqual({ selected: false });
  });

  it('calls onSelectIcon with the clicked icon name', async () => {
    const onSelectIcon = jest.fn();

    await renderWithProviders(<IconPicker selectedIcon="moon" onSelectIcon={onSelectIcon} />);

    const sunButton = screen.getByLabelText('Icon sun');
    await fireEvent.press(sunButton);

    expect(onSelectIcon).toHaveBeenCalledWith('sun');
  });
});
