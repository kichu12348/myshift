import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface FinanceTemplateDeleteCardProps {
  readonly onDelete: () => void;
  readonly isDeleting?: boolean | undefined;
}

export function FinanceTemplateDeleteCard({
  onDelete,
  isDeleting = false,
}: FinanceTemplateDeleteCardProps): ReactElement {
  const styles = useStyles();
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePress = (): void => {
    if (!isConfirming) {
      haptics.warning();
      setIsConfirming(true);
      return;
    }
    haptics.selection();
    onDelete();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isConfirming ? 'Tap again to confirm delete' : 'Delete Template'}
      disabled={isDeleting}
      onPress={handlePress}
      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
    >
      <Text variant="bodySmall" weight="semibold" tone="danger">
        {isConfirming ? 'Tap again to confirm delete' : 'Delete Template'}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: theme.sizes.size1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
}));
