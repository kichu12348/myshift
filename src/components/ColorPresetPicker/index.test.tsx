import { fireEvent, screen } from '@testing-library/react-native';
import { ColorPresetPicker } from './index';
import { renderWithProviders } from '@/testing';

describe('ColorPresetPicker', () => {
  it('renders color preset options and marks selected color', async () => {
    const onSelectColor = jest.fn();

    await renderWithProviders(
      <ColorPresetPicker selectedColor="#5B7DB1" onSelectColor={onSelectColor} />,
    );

    const steelBlueButton = screen.getByLabelText('Color Steel blue');
    expect(steelBlueButton).toBeTruthy();
    expect(steelBlueButton.props.accessibilityState).toEqual({ selected: true });

    const amberButton = screen.getByLabelText('Color Amber');
    expect(amberButton).toBeTruthy();
    expect(amberButton.props.accessibilityState).toEqual({ selected: false });
  });

  it('calls onSelectColor with the preset light hex when pressed', async () => {
    const onSelectColor = jest.fn();

    await renderWithProviders(
      <ColorPresetPicker selectedColor="#5B7DB1" onSelectColor={onSelectColor} />,
    );

    const amberButton = screen.getByLabelText('Color Amber');
    await fireEvent.press(amberButton);

    expect(onSelectColor).toHaveBeenCalledWith('#F59E0B');
  });
});
