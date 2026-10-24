import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';

export interface SheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly accessibilityLabel?: string;
}

/**
 * Accessible modal bottom sheet primitive built with React Native Modal.
 * Displays content on surfaceRaised background with backdrop tap-to-dismiss.
 */
export function Sheet({
  visible,
  onClose,
  children,
  accessibilityLabel,
}: SheetProps): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Modal
      transparent
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.sheetContainer,
            {
              paddingBottom:
                insets.bottom > 0 ? insets.bottom : styles.sheetContainer.paddingBottom,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.background,
    opacity: 0.7,
  },
  sheetContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    maxHeight: '85%',
  },
}));
