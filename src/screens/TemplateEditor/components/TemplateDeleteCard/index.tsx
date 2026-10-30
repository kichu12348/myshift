import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface TemplateDeleteCardProps {
  readonly onDelete: () => void;
  readonly isDeleting?: boolean | undefined;
}

export function TemplateDeleteCard({
  onDelete,
  isDeleting = false,
}: TemplateDeleteCardProps): ReactElement {
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isConfirming ? 'Tap again to confirm delete' : 'Delete template'}
      onPress={handlePress}
      disabled={isDeleting}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.badge}>
        <Icon name="trash-2" size={20} tone="danger" />
      </View>

      <View style={styles.content}>
        <Text variant="body" weight="semibold" tone="danger">
          {isConfirming ? 'Tap again to confirm delete' : 'Delete Template'}
        </Text>
        <Text variant="caption" tone="muted">
          {isConfirming
            ? 'This action will archive this template'
            : 'Archive this template from active shift selection'}
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
