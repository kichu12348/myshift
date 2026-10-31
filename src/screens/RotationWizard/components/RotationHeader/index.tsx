import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import type { Rotation } from '@/domain';
import { makeStyles } from '@/theme';

export interface RotationHeaderProps {
  readonly onGoBack: () => void;
  readonly existingRotation?: Rotation | undefined;
  readonly onClearPattern: () => void;
}

export function RotationHeader({
  onGoBack,
  existingRotation,
  onClearPattern,
}: RotationHeaderProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <IconButton iconName="chevron-left" accessibilityLabel="Back" onPress={onGoBack} />
        <Text variant="title" weight="semibold">
          Repeating Rotation
        </Text>
      </View>

      <View style={styles.headerRight}>
        {existingRotation?.active ? (
          <View
            style={styles.activePill}
            accessibilityRole="text"
            accessibilityLabel="Rotation is active"
          >
            <View style={styles.activeDot} />
            <Text variant="caption" weight="semibold" style={styles.activeText}>
              Active
            </Text>
          </View>
        ) : existingRotation !== undefined ? (
          <Pressable
            onPress={onClearPattern}
            hitSlop={styles.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Clear rotation sequence"
          >
            <Text variant="caption" tone="muted" weight="semibold">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerRight: {
    paddingRight: theme.spacing.sm,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  activeDot: {
    width: theme.spacing.xs,
    height: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
  },
  activeText: {
    color: theme.colors.success,
  },
  hitSlop: {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
}));
