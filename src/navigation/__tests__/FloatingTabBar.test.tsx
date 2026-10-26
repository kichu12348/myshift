import type { ReactElement } from 'react';
import { View } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '../FloatingTabBar';
import { renderWithProviders } from '@/testing';
import { TAB_ROUTES } from '@/constants/routes';
import { haptics } from '@/services';

type TabRoute = BottomTabBarProps['state']['routes'][number];
type TabDescriptor = BottomTabBarProps['descriptors'][string];

function createMockTabBarProps(options?: {
  readonly activeIndex?: number;
  readonly defaultPrevented?: boolean;
}): {
  readonly props: BottomTabBarProps;
  readonly mockNavigate: jest.Mock;
  readonly mockEmit: jest.Mock;
} {
  const activeIndex = options?.activeIndex ?? 0;
  const isDefaultPrevented = options?.defaultPrevented ?? false;
  const mockNavigate = jest.fn();
  const mockEmit = jest.fn().mockReturnValue({ defaultPrevented: isDefaultPrevented });

  const routes: readonly TabRoute[] = [
    { key: 'calendar-key', name: TAB_ROUTES.CALENDAR },
    { key: 'stats-key', name: TAB_ROUTES.STATS },
    { key: 'settings-key', name: TAB_ROUTES.SETTINGS },
  ];

  const descriptors: Record<string, TabDescriptor> = {
    'calendar-key': {
      options: { tabBarLabel: 'Calendar' },
      navigation: {} as TabDescriptor['navigation'],
      route: routes[0] as TabDescriptor['route'],
      render: (): ReactElement => <View />,
    },
    'stats-key': {
      options: { tabBarLabel: 'Stats' },
      navigation: {} as TabDescriptor['navigation'],
      route: routes[1] as TabDescriptor['route'],
      render: (): ReactElement => <View />,
    },
    'settings-key': {
      options: { tabBarLabel: 'Settings' },
      navigation: {} as TabDescriptor['navigation'],
      route: routes[2] as TabDescriptor['route'],
      render: (): ReactElement => <View />,
    },
  };

  const state: BottomTabBarProps['state'] = {
    index: activeIndex,
    routes: [...routes],
    key: 'tab-state-key',
    routeNames: [TAB_ROUTES.CALENDAR, TAB_ROUTES.STATS, TAB_ROUTES.SETTINGS],
    type: 'tab',
    stale: false,
    history: [],
    preloadedRouteKeys: [],
  };

  const navigation = {
    navigate: mockNavigate,
    emit: mockEmit,
  } as unknown as BottomTabBarProps['navigation'];

  const insets: BottomTabBarProps['insets'] = {
    top: 47,
    left: 0,
    right: 0,
    bottom: 34,
  };

  return {
    props: {
      state,
      descriptors,
      navigation,
      insets,
    },
    mockNavigate,
    mockEmit,
  };
}

describe('FloatingTabBar Component', () => {
  let selectionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    selectionSpy = jest.spyOn(haptics, 'selection');
  });

  afterEach(() => {
    selectionSpy.mockRestore();
  });

  it('renders all three tabs with accessibility roles and labels', async () => {
    const { props } = createMockTabBarProps({ activeIndex: 0 });
    await renderWithProviders(<FloatingTabBar {...props} />);

    expect(screen.getByRole('tab', { name: 'Calendar', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Stats', selected: false })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Settings', selected: false })).toBeTruthy();
  });

  it('emits tabPress, plays haptics, and navigates when pressing an inactive tab', async () => {
    const { props, mockNavigate, mockEmit } = createMockTabBarProps({ activeIndex: 0 });
    await renderWithProviders(<FloatingTabBar {...props} />);

    const statsTab = screen.getByRole('tab', { name: 'Stats' });
    await fireEvent.press(statsTab);

    expect(mockEmit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'stats-key',
      canPreventDefault: true,
    });
    expect(selectionSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(TAB_ROUTES.STATS);
  });

  it('does not navigate or trigger haptics if tabPress default is prevented', async () => {
    const { props, mockNavigate } = createMockTabBarProps({
      activeIndex: 0,
      defaultPrevented: true,
    });
    await renderWithProviders(<FloatingTabBar {...props} />);

    const statsTab = screen.getByRole('tab', { name: 'Stats' });
    await fireEvent.press(statsTab);

    expect(selectionSpy).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate or trigger haptics when pressing the already active tab', async () => {
    const { props, mockNavigate, mockEmit } = createMockTabBarProps({ activeIndex: 0 });
    await renderWithProviders(<FloatingTabBar {...props} />);

    const calendarTab = screen.getByRole('tab', { name: 'Calendar' });
    await fireEvent.press(calendarTab);

    expect(mockEmit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'calendar-key',
      canPreventDefault: true,
    });
    expect(selectionSpy).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('emits tabLongPress on long press', async () => {
    const { props, mockEmit } = createMockTabBarProps({ activeIndex: 0 });
    await renderWithProviders(<FloatingTabBar {...props} />);

    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    await fireEvent(settingsTab, 'longPress');

    expect(mockEmit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'settings-key',
    });
  });
});
