import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { LayoutChangeEvent, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TAB_ROUTES } from '@/constants/routes';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

const ANIMATION_DURATION_MS = 200;

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
 * Modern floating pill dock bottom tab bar with an animated indicator bubble.
 * Matches the SettingsScreen card and squircle aesthetic.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactElement {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { width: windowWidth } = useWindowDimensions();

  const tabCount = state.routes.length;
  const padding = theme.spacing.xs;
  const gap = theme.spacing.xs;

  const initialDockWidth = Math.max(0, windowWidth - 2 * theme.spacing.lg);
  const [dockWidth, setDockWidth] = useState<number>(initialDockWidth);

  const totalTabWidth = dockWidth - 2 * padding - Math.max(0, tabCount - 1) * gap;
  const tabWidth = tabCount > 0 ? Math.max(0, totalTabWidth / tabCount) : 0;

  const initialX = state.index * (tabWidth + gap);
  const translateX = useSharedValue(initialX);
  const isMounted = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const targetX = state.index * (tabWidth + gap);
    if (!isMounted.current) {
      isMounted.current = true;
      translateX.value = targetX;
      return;
    }

    if (shouldReduceMotion) {
      translateX.value = targetX;
    } else {
      translateX.value = withTiming(targetX, {
        duration: ANIMATION_DURATION_MS,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [state.index, tabWidth, gap, shouldReduceMotion, translateX]);

  const onDockLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      const width = event.nativeEvent.layout.width;
      if (width > 0 && Math.abs(width - dockWidth) > 0.5) {
        setDockWidth(width);
      }
    },
    [dockWidth],
  );

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bubbleWidthStyle = useMemo(
    () => ({
      width: tabWidth,
      opacity: tabWidth > 0 ? 1 : 0,
    }),
    [tabWidth],
  );

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
      <View style={styles.dock} onLayout={onDockLayout}>
        <Animated.View
          testID="floating-tab-bar-bubble"
          pointerEvents="none"
          style={[styles.bubble, bubbleWidthStyle, animatedBubbleStyle]}
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
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  dock: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.tabBarMinHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  bubble: {
    position: 'absolute',
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  tabItem: {
    flex: 1,
    minHeight: theme.sizes.tabItemMinHeight,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.sizes.tabItemGap,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
}));
