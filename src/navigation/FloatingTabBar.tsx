import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TAB_ROUTES } from '@/constants/routes';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

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
 * Modern floating pill dock bottom tab bar.
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

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
      <View style={styles.dock}>
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
              style={[styles.tabItem, isFocused ? styles.tabItemActive : styles.tabItemInactive]}
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
  tabItem: {
    flex: 1,
    minHeight: theme.sizes.tabItemMinHeight,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.sizes.tabItemGap,
  },
  tabItemActive: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.hairline,

    borderColor: theme.colors.accent,
  },
  tabItemInactive: {
    backgroundColor: 'transparent',
  },
}));
