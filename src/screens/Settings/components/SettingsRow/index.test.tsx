import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { SettingsRow } from './index';
import { Text } from '@/components/Text';
import { renderWithProviders } from '@/testing';

describe('SettingsRow', () => {
  it('renders title, subtitle, and right element', async () => {
    await renderWithProviders(
      <SettingsRow
        icon="moon"
        title="Dark Mode"
        subtitle="Theme setting"
        rightElement={
          <View testID="custom-accessory">
            <Text>Accessory</Text>
          </View>
        }
      />,
    );

    expect(screen.getByText('Dark Mode')).toBeTruthy();
    expect(screen.getByText('Theme setting')).toBeTruthy();
    expect(screen.getByTestId('custom-accessory')).toBeTruthy();
  });

  it('handles onPress when provided', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <SettingsRow icon="calendar" title="Start of Week" showChevron onPress={onPress} />,
    );

    const button = screen.getByRole('button', { name: 'Start of Week' });
    await fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders danger tone row with danger styling', async () => {
    await renderWithProviders(
      <SettingsRow
        icon="rotate-ccw"
        tone="danger"
        title="Reset Preferences"
        subtitle="Restore default app settings"
        showChevron
      />,
    );

    expect(screen.getByText('Reset Preferences')).toBeTruthy();
    expect(screen.getByText('Restore default app settings')).toBeTruthy();
  });
});
