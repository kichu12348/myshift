import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface StopRotationCardProps {
  readonly onStop: () => void;
}

export function StopRotationCard({ onStop }: StopRotationCardProps): ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const styles = useStyles();

  const handlePress = (): void => {
    if (!isConfirming) {
      haptics.warning();
      setIsConfirming(true);
    } else {
      haptics.warning();
      onStop();
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.mainPressable}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={
          isConfirming ? 'Tap again to confirm stop rotation' : 'Stop Repeating Rotation'
        }
      >
        <View style={styles.iconBadge}>
          <Icon name="trash-2" size={20} tone="danger" />
        </View>
        <View style={styles.textStack}>
          <Text variant="body" weight="semibold" tone="danger">
            {isConfirming ? 'Tap again to confirm' : 'Stop Repeating Rotation'}
          </Text>
          <Text variant="caption" tone="muted">
            Remove future rotation projections
          </Text>
        </View>
      </Pressable>

      {isConfirming ? (
        <Pressable
          style={styles.cancelButton}
          onPress={() => setIsConfirming(false)}
          accessibilityRole="button"
          accessibilityLabel="Cancel stopping rotation"
        >
          <Text variant="caption" tone="muted" weight="semibold">
            Cancel
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
