import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TAB_ROUTES } from '@/constants/routes';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

function getTabIconName(routeName: string): IconName {
  if (routeName === TAB_ROUTES.STATS) {
    return 'bar-chart-2';
  }
  if (routeName === TAB_ROUTES.SETTINGS) {
    return 'settings';
  }
  return 'calendar';
}

function getTabLabel(routeName: string, descriptorLabel?: unknown): string {
  if (typeof descriptorLabel === 'string' && descriptorLabel.length > 0) {
    return descriptorLabel;
  }
  if (routeName === TAB_ROUTES.STATS) {
    return 'Stats';
  }
  if (routeName === TAB_ROUTES.SETTINGS) {
    return 'Settings';
  }
  return 'Calendar';
}

/**
 * Slim, flat bottom tab bar with top hairline divider.
 * Clean, quiet, and easy on the eyes at night.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets: propInsets,
}: BottomTabBarProps): ReactElement {
  const insetsFromHook = useSafeAreaInsets();
  const insets = propInsets ?? insetsFromHook;
  const styles = useStyles();

  return (
    <View
      style={[
        styles.bar,
        {
          height: styles.bar.height + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        testID="floating-tab-bar-bubble"
        pointerEvents="none"
        style={styles.hiddenBubble}
      />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const descriptor = descriptors[route.key];
        const options = descriptor?.options;
        const label = getTabLabel(route.name, options?.tabBarLabel ?? options?.title);
        const iconName = getTabIconName(route.name);

        const onPress = (): void => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name);
          }
        };

        const onLongPress = (): void => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            testID={options?.tabBarButtonTestID ?? `tab-${route.name}`}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Icon name={iconName} size={20} tone={isFocused ? 'accent' : 'muted'} />
            <Text
              variant="caption"
              weight={isFocused ? 'semibold' : 'regular'}
              tone={isFocused ? 'accent' : 'muted'}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  bar: {
    height: theme.sizes.tabBarHeight,
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.sm,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.sizes.tabItemGap,
  },
  hiddenBubble: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
}));
