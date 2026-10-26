import { screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { SettingsCard } from './index';
import { Text } from '@/components/Text';
import { renderWithProviders } from '@/testing';

describe('SettingsCard', () => {
  it('renders section title in uppercase and children with dividers', async () => {
    await renderWithProviders(
      <SettingsCard title="Preferences">
        <View testID="child-1">
          <Text>Item 1</Text>
        </View>
        <View testID="child-2">
          <Text>Item 2</Text>
        </View>
      </SettingsCard>,
    );

    expect(screen.getByText('PREFERENCES')).toBeTruthy();
    expect(screen.getByTestId('child-1')).toBeTruthy();
    expect(screen.getByTestId('child-2')).toBeTruthy();
  });

  it('renders danger variant card', async () => {
    await renderWithProviders(
      <SettingsCard variant="danger" testID="danger-card">
        <Text>Danger Content</Text>
      </SettingsCard>,
    );

    expect(screen.getByTestId('danger-card')).toBeTruthy();
    expect(screen.getByText('Danger Content')).toBeTruthy();
  });
});
