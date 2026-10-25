/**
 * Jest global setup and strictly typed native module mocks.
 * Per AGENTS.md Section 5.
 */
jest.mock('react-native-reanimated', () => {
  const actualRN = jest.requireActual<typeof import('react-native')>('react-native');
  const View = actualRN.View;
  const Text = actualRN.Text;
  const ScrollView = actualRN.ScrollView;

  const createAnimationBuilderMock = () => {
    const builder = {
      duration: () => builder,
      delay: () => builder,
      springify: () => builder,
      damping: () => builder,
      stiffness: () => builder,
      withCallback: () => builder,
      build: () => () => ({ initialValues: {}, animations: {} }),
    };
    return builder;
  };

  return {
    __esModule: true,
    default: {
      View,
      Text,
      ScrollView,
      createAnimatedComponent: (c: unknown) => c,
    },
    Animated: {
      View,
      Text,
      ScrollView,
      createAnimatedComponent: (c: unknown) => c,
    },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useReducedMotion: () => false,
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    withTiming: (toValue: unknown, _config?: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withSpring: (toValue: unknown, _config?: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withSequence: (...animations: unknown[]) => animations[animations.length - 1],
    withDelay: (_delay: number, animation: unknown) => animation,
    withRepeat: (animation: unknown) => animation,
    FadeIn: createAnimationBuilderMock(),
    FadeOut: createAnimationBuilderMock(),
    FadeInDown: createAnimationBuilderMock(),
    FadeOutUp: createAnimationBuilderMock(),
    LinearTransition: createAnimationBuilderMock(),
    Layout: createAnimationBuilderMock(),
    Easing: {
      bezier: () => (t: number) => t,
      ease: (t: number) => t,
      linear: (t: number) => t,
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  AndroidImportance: {
    HIGH: 4,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
    withTransactionSync: jest.fn(),
  }),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));
