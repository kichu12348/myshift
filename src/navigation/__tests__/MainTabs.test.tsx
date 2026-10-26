import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainTabs } from '../MainTabs';
import { TabNavigator } from '../TabNavigator';
import { renderWithProviders } from '@/testing';
import { haptics } from '@/services';

jest.mock('@/screens/Calendar', () => ({
  CalendarScreen: () => {
    const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <View testID="calendar-screen">
        <Text>Calendar Screen Content</Text>
      </View>
    );
  },
}));

jest.mock('@/screens/Stats', () => ({
  StatsScreen: () => {
    const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <View testID="stats-screen">
        <Text>Stats Screen Content</Text>
      </View>
    );
  },
}));

jest.mock('@/screens/Settings', () => ({
  SettingsScreen: () => {
    const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <View testID="settings-screen">
        <Text>Settings Screen Content</Text>
      </View>
    );
  },
}));

describe('MainTabs Navigation with FloatingTabBar', () => {
  let selectionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    selectionSpy = jest.spyOn(haptics, 'selection');
  });

  afterEach(() => {
    selectionSpy.mockRestore();
  });

  it('renders the floating dock tab bar with all tabs', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
    );

    expect(screen.getByRole('tab', { name: 'Calendar' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Stats' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeTruthy();
  });

  it('initially highlights Calendar as active and renders its screen content', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
    );

    expect(screen.getByRole('tab', { name: 'Calendar', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Stats', selected: false })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Settings', selected: false })).toBeTruthy();

    expect(screen.getByTestId('calendar-screen')).toBeTruthy();
  });

  it('navigates to Stats when Stats tab is pressed and triggers haptic feedback', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
    );

    const statsTab = screen.getByRole('tab', { name: 'Stats' });
    await fireEvent.press(statsTab);

    expect(selectionSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Stats', selected: true })).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Calendar', selected: false })).toBeTruthy();
      expect(screen.getByTestId('stats-screen')).toBeTruthy();
    });
  });

  it('navigates to Settings when Settings tab is pressed and triggers haptic feedback', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
    );

    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    await fireEvent.press(settingsTab);

    expect(selectionSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Settings', selected: true })).toBeTruthy();
      expect(screen.getByTestId('settings-screen')).toBeTruthy();
    });
  });

  it('does not trigger navigation or haptics when pressing the already-focused tab', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
    );

    const calendarTab = screen.getByRole('tab', { name: 'Calendar' });
    await fireEvent.press(calendarTab);

    expect(selectionSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('calendar-screen')).toBeTruthy();
  });

  it('renders correctly under light mode theme', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>,
      { theme: 'light' },
    );

    expect(screen.getByRole('tab', { name: 'Calendar', selected: true })).toBeTruthy();
  });

  it('TabNavigator alias exports and behaves identically to MainTabs', () => {
    expect(TabNavigator).toBe(MainTabs);
  });
});
