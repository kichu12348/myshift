import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface RotationDateRowProps {
  readonly iconName: IconName;
  readonly title: string;
  readonly subtitle: string;
  readonly dateLabel: string;
  readonly isMuted?: boolean | undefined;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly onClear?: (() => void) | undefined;
}

export function RotationDateRow({
  iconName,
  title,
  subtitle,
  dateLabel,
  isMuted = false,
  onPress,
  accessibilityLabel,
  onClear,
}: RotationDateRowProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <View style={styles.leftGroup}>
        <View style={styles.iconBadge}>
          <Icon name={iconName} size={20} tone="accent" />
        </View>
        <View style={styles.textStack}>
          <Text variant="body" weight="semibold">
            {title}
          </Text>
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.rightGroup}>
        <Pressable
          style={styles.datePill}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Text
            variant="bodySmall"
            weight="semibold"
            tone={isMuted ? 'muted' : 'text'}
            tabularNums={!isMuted}
          >
            {dateLabel}
          </Text>
          <Icon name="chevron-right" size={16} tone="muted" />
        </Pressable>

        {onClear !== undefined ? (
          <Pressable
            onPress={onClear}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear end date to ongoing"
            hitSlop={styles.hitSlop}
          >
            <Icon name="x" size={16} tone="muted" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  clearButton: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitSlop: {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
}));
