import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface PayPeriodDateRowProps {
  readonly label: string;
  readonly dateFormatted: string;
  readonly onOpenPicker: () => void;
  readonly testPillLabel: string;
}

export function PayPeriodDateRow({
  label,
  dateFormatted,
  onOpenPicker,
  testPillLabel,
}: PayPeriodDateRowProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name="calendar" size={18} tone="muted" />
        <Text variant="body">{label}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={testPillLabel}
        onPress={onOpenPicker}
        style={({ pressed }) => [styles.datePill, pressed && styles.pressed]}
        hitSlop={styles.hitSlop}
      >
        <Text variant="bodySmall" weight="semibold" tabularNums tone="onAccent">
          {dateFormatted}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },

  datePill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
