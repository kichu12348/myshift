import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface ShiftDeleteCardProps {
  readonly onDelete: () => void;
  readonly isDeleting?: boolean | undefined;
  readonly isRotationShift?: boolean | undefined;
}

export function ShiftDeleteCard({
  onDelete,
  isDeleting = false,
  isRotationShift = false,
}: ShiftDeleteCardProps): ReactElement {
  const styles = useStyles();
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePress = (): void => {
    if (!isConfirming) {
      haptics.warning();
      setIsConfirming(true);
    } else {
      onDelete();
    }
  };

  const primaryLabel = isConfirming
    ? 'Tap again to confirm delete'
    : isRotationShift
      ? 'Remove from Rotation'
      : 'Delete Shift';

  const secondaryLabel = isConfirming
    ? isRotationShift
      ? 'This action will skip this occurrence in the rotation'
      : 'This action will remove this shift completely'
    : isRotationShift
      ? 'Skip this rotation shift on this date'
      : 'Delete this shift from your calendar';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={primaryLabel}
      onPress={handlePress}
      disabled={isDeleting}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.badge}>
        <Icon name="trash-2" size={20} tone="danger" />
      </View>

      <View style={styles.content}>
        <Text variant="body" weight="semibold" tone="danger">
          {primaryLabel}
        </Text>
        <Text variant="caption" tone="muted">
          {secondaryLabel}
        </Text>
      </View>
    </Pressable>
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
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  badge: {
    width: theme.sizes.iconBadgeSmall,
    height: theme.sizes.iconBadgeSmall,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.danger}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}));

