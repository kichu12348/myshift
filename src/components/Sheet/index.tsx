import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '@/theme';

export interface SheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly accessibilityLabel?: string | undefined;
  readonly expandable?: boolean | undefined;
  readonly showHandle?: boolean | undefined;
  readonly onExpandChange?: ((isExpanded: boolean) => void) | undefined;
}

const TIMING_CURVE = Easing.bezier(0.25, 0.1, 0.25, 1);
const DURATION_OPEN = 220;
const DURATION_CLOSE = 180;
const DURATION_EXPAND = 220;

/**
 * Expandable bottom sheet built with React Native Gesture Handler and Reanimated.
 * Features smooth timing transitions (no bounce/spring), static bottom section anchoring,
 * and fluid upward expansion for header and list content.
 */
export function Sheet({
  visible,
  onClose,
  children,
  accessibilityLabel,
  expandable = false,
  showHandle = true,
  onExpandChange,
}: SheetProps): ReactElement {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useStyles();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isExpandedState, setIsExpandedState] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription.remove();
    };
  }, []);

  const expandedHeight = screenHeight - insets.top - theme.spacing.md;
  const initialHeight = expandable
    ? Math.min(Math.round(screenHeight * 0.58), expandedHeight - 40)
    : expandedHeight;

  const snapClosed = expandedHeight + insets.bottom + 40;
  const closeThreshold = theme.sizes.sheetCloseThreshold;

  const sheetHeight = useSharedValue(initialHeight);
  const translateY = useSharedValue(visible ? 0 : snapClosed);

  const startHeight = useSharedValue(initialHeight);
  const startTranslateY = useSharedValue(0);

  const isExpandedShared = useSharedValue(false);

  const isFirstMount = useRef(true);
  const prevVisible = useRef(visible);

  const handleSetExpanded = useCallback(
    (expanded: boolean): void => {
      setIsExpandedState(expanded);
      onExpandChange?.(expanded);
    },
    [onExpandChange],
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (visible) {
        sheetHeight.value = initialHeight;
        translateY.value = 0;
        isExpandedShared.value = false;
        setIsExpandedState(false);
      } else {
        translateY.value = snapClosed;
      }
      return;
    }

    if (visible && !prevVisible.current) {
      sheetHeight.value = initialHeight;
      isExpandedShared.value = false;
      setIsExpandedState(false);
      onExpandChange?.(false);
      if (reduceMotion) {
        translateY.value = 0;
      } else {
        translateY.value = withTiming(0, {
          duration: DURATION_OPEN,
          easing: TIMING_CURVE,
        });
      }
    } else if (!visible && prevVisible.current) {
      if (reduceMotion) {
        translateY.value = snapClosed;
      } else {
        translateY.value = withTiming(snapClosed, {
          duration: DURATION_CLOSE,
          easing: TIMING_CURVE,
        });
      }
    }
    prevVisible.current = visible;
  }, [
    visible,
    initialHeight,
    snapClosed,
    reduceMotion,
    onExpandChange,
    sheetHeight,
    translateY,
    isExpandedShared,
  ]);

  const handleClose = useCallback((): void => {
    if (reduceMotion) {
      translateY.value = snapClosed;
      onClose();
    } else {
      translateY.value = withTiming(
        snapClosed,
        { duration: DURATION_CLOSE, easing: TIMING_CURVE },
        (finished) => {
          if (finished) {
            scheduleOnRN(onClose);
          }
        },
      );
    }
  }, [reduceMotion, snapClosed, onClose, translateY]);

  const toggleExpand = useCallback((): void => {
    if (!expandable) {
      return;
    }
    const targetExpanded = !isExpandedShared.value;
    const targetHeight = targetExpanded ? expandedHeight : initialHeight;
    isExpandedShared.value = targetExpanded;
    handleSetExpanded(targetExpanded);

    if (reduceMotion) {
      sheetHeight.value = targetHeight;
    } else {
      sheetHeight.value = withTiming(targetHeight, {
        duration: DURATION_EXPAND,
        easing: TIMING_CURVE,
      });
    }
  }, [
    expandable,
    isExpandedShared,
    expandedHeight,
    initialHeight,
    handleSetExpanded,
    reduceMotion,
    sheetHeight,
  ]);

  const panGesture = usePanGesture({
    activeOffsetY: [-8, 8],
    onBegin: () => {
      'worklet';
      startHeight.value = sheetHeight.value;
      startTranslateY.value = translateY.value;
    },
    onActivate: () => {
      'worklet';
      startHeight.value = sheetHeight.value;
      startTranslateY.value = translateY.value;
    },
    onUpdate: (event) => {
      'worklet';
      const deltaY = event.translationY;

      if (!expandable) {
        if (deltaY > 0) {
          translateY.value = startTranslateY.value + deltaY;
        } else {
          translateY.value = startTranslateY.value + deltaY * 0.2;
        }
        return;
      }

      if (startHeight.value >= expandedHeight - 10) {
        if (deltaY > 0) {
          const newHeight = expandedHeight - deltaY;
          if (newHeight >= initialHeight) {
            sheetHeight.value = newHeight;
            translateY.value = 0;
          } else {
            sheetHeight.value = initialHeight;
            translateY.value = initialHeight - newHeight;
          }
        } else {
          sheetHeight.value = expandedHeight - deltaY * 0.2;
          translateY.value = 0;
        }
      } else {
        if (deltaY < 0) {
          const newHeight = initialHeight - deltaY;
          if (newHeight <= expandedHeight) {
            sheetHeight.value = newHeight;
          } else {
            sheetHeight.value = expandedHeight + (newHeight - expandedHeight) * 0.2;
          }
          translateY.value = 0;
        } else {
          sheetHeight.value = initialHeight;
          translateY.value = startTranslateY.value + deltaY;
        }
      }
    },
    onDeactivate: (event) => {
      'worklet';
      const velocityY = event.velocityY;
      const currentTranslateY = translateY.value;
      const currentHeight = sheetHeight.value;

      if (!expandable) {
        if (currentTranslateY > closeThreshold || velocityY > 500) {
          translateY.value = withTiming(
            snapClosed,
            { duration: DURATION_CLOSE, easing: TIMING_CURVE },
            (finished) => {
              if (finished) {
                scheduleOnRN(onClose);
              }
            },
          );
        } else {
          translateY.value = withTiming(0, {
            duration: DURATION_OPEN,
            easing: TIMING_CURVE,
          });
        }
        return;
      }

      if (currentTranslateY > closeThreshold || (currentTranslateY > 10 && velocityY > 500)) {
        translateY.value = withTiming(
          snapClosed,
          { duration: DURATION_CLOSE, easing: TIMING_CURVE },
          (finished) => {
            if (finished) {
              scheduleOnRN(onClose);
            }
          },
        );
        return;
      }

      if (currentTranslateY > 0) {
        translateY.value = withTiming(0, {
          duration: DURATION_OPEN,
          easing: TIMING_CURVE,
        });
      }

      if (velocityY < -400) {
        sheetHeight.value = withTiming(expandedHeight, {
          duration: DURATION_EXPAND,
          easing: TIMING_CURVE,
        });
        isExpandedShared.value = true;
        scheduleOnRN(handleSetExpanded, true);
        return;
      }

      if (velocityY > 400) {
        sheetHeight.value = withTiming(initialHeight, {
          duration: DURATION_EXPAND,
          easing: TIMING_CURVE,
        });
        isExpandedShared.value = false;
        scheduleOnRN(handleSetExpanded, false);
        return;
      }

      const midHeight = (initialHeight + expandedHeight) / 2;
      if (currentHeight > midHeight) {
        sheetHeight.value = withTiming(expandedHeight, {
          duration: DURATION_EXPAND,
          easing: TIMING_CURVE,
        });
        isExpandedShared.value = true;
        scheduleOnRN(handleSetExpanded, true);
      } else {
        sheetHeight.value = withTiming(initialHeight, {
          duration: DURATION_EXPAND,
          easing: TIMING_CURVE,
        });
        isExpandedShared.value = false;
        scheduleOnRN(handleSetExpanded, false);
      }
    },
  });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [0, snapClosed], [0.6, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss sheet"
              onPress={handleClose}
              style={styles.backdropPressable}
            />
          </Animated.View>
          <Animated.View
            accessibilityLabel={accessibilityLabel}
            style={[
              styles.sheetContainer,
              {
                paddingBottom: insets.bottom > 0 ? insets.bottom : theme.spacing.md,
              },
              sheetAnimatedStyle,
            ]}
          >
            {showHandle ? (
              <GestureDetector gesture={panGesture}>
                <Pressable
                  accessibilityRole={expandable ? 'button' : undefined}
                  accessibilityLabel={
                    expandable ? (isExpandedState ? 'Collapse sheet' : 'Expand sheet') : undefined
                  }
                  onPress={toggleExpand}
                  style={styles.handleContainer}
                >
                  <View style={styles.handle} />
                </Pressable>
              </GestureDetector>
            ) : null}
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.background,
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: theme.sizes.sheetHandleWidth,
    height: theme.sizes.sheetHandleHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
  },
}));
