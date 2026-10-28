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
      out: (fn: (t: number) => number) => (t: number) => 1 - fn(1 - t),
      in: (fn: (t: number) => number) => (t: number) => fn(t),
      cubic: (t: number) => t * t * t,
      quad: (t: number) => t * t,
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
    interpolate: (val: number, input: number[], output: number[]): number => {
      if (input.length < 2 || output.length < 2) {
        return output[0] ?? 0;
      }
      const inMin = input[0] ?? 0;
      const inMax = input[input.length - 1] ?? 1;
      const outMin = output[0] ?? 0;
      const outMax = output[output.length - 1] ?? 1;
      if (inMax === inMin) {
        return outMin;
      }
      const progress = (val - inMin) / (inMax - inMin);
      return outMin + progress * (outMax - outMin);
    },
    Extrapolation: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
  };
});

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]): void => {
    fn(...args);
  },
  runOnJS:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]): unknown => {
      return fn(...args);
    },
  runOnUI:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]): unknown => {
      return fn(...args);
    },
  scheduleOnUI: (fn: (...args: unknown[]) => unknown, ...args: unknown[]): void => {
    fn(...args);
  },
}));

jest.mock('react-native-gesture-handler', () => {
  const actualRN = jest.requireActual<typeof import('react-native')>('react-native');
  const View = actualRN.View;

  interface MockGesture {
    onStart: (cb: (event: unknown) => void) => MockGesture;
    onUpdate: (cb: (event: { translationX: number; translationY: number }) => void) => MockGesture;
    onEnd: (cb: (event: { velocityX: number; velocityY: number }) => void) => MockGesture;
    onFinalize: (cb: (event: unknown, success: boolean) => void) => MockGesture;
    enabled: (enabled: boolean) => MockGesture;
    simultaneousWithExternalGesture: (...args: unknown[]) => MockGesture;
    requireExternalGestureToFail: (...args: unknown[]) => MockGesture;
    shouldCancelWhenOutside: (value: boolean) => MockGesture;
    activeOffsetY: (offset: number | number[]) => MockGesture;
    activeOffsetX: (offset: number | number[]) => MockGesture;
    failOffsetX: (offset: number | number[]) => MockGesture;
    failOffsetY: (offset: number | number[]) => MockGesture;
    runOnJS: (run: boolean) => MockGesture;
  }

  const createGesture = (): MockGesture => {
    const gesture: MockGesture = {
      onStart: () => gesture,
      onUpdate: () => gesture,
      onEnd: () => gesture,
      onFinalize: () => gesture,
      enabled: () => gesture,
      simultaneousWithExternalGesture: () => gesture,
      requireExternalGestureToFail: () => gesture,
      shouldCancelWhenOutside: () => gesture,
      activeOffsetY: () => gesture,
      activeOffsetX: () => gesture,
      failOffsetX: () => gesture,
      failOffsetY: () => gesture,
      runOnJS: () => gesture,
    };
    return gesture;
  };

  return {
    __esModule: true,
    GestureHandlerRootView: View,
    GestureDetector: ({ children }: { readonly children?: React.ReactNode }) => children,
    Gesture: {
      Pan: (): MockGesture => createGesture(),
      Tap: (): MockGesture => createGesture(),
      Fling: (): MockGesture => createGesture(),
      Pinch: (): MockGesture => createGesture(),
      Rotation: (): MockGesture => createGesture(),
      Simultaneous: (): MockGesture => createGesture(),
      Race: (): MockGesture => createGesture(),
      Exclusive: (): MockGesture => createGesture(),
    },
    usePanGesture: () => ({}),
    PanGestureHandler: View,
    State: {},
    Directions: {},
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
