import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatCurrency } from '../../types';

export interface EarningsBreakdownCardProps {
  readonly isManualGross: boolean;
  readonly grossPay: number;
  readonly totalDeductions: number;
  readonly takeHomePay: number;
  readonly onPressGross?: (() => void) | undefined;
}

export function EarningsBreakdownCard({
  isManualGross,
  grossPay,
  totalDeductions,
  takeHomePay,
  onPressGross,
}: EarningsBreakdownCardProps): ReactElement {
  const styles = useStyles();

  const formattedGross = formatCurrency(grossPay);
  const formattedTotalDeductions = formatCurrency(totalDeductions);
  const formattedTakeHomePay = formatCurrency(takeHomePay);

  return (
    <View style={styles.card}>
      {/* Row 1: Gross (Pressable -> opens GrossAndCutoffModal) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit gross earnings"
        disabled={onPressGross === undefined}
        onPress={onPressGross}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        hitSlop={styles.hitSlop}
      >
        <View style={styles.rowLeft}>
          <Icon name="trending-up" size={18} tone="muted" />
          <Text variant="body">{isManualGross ? 'Gross (Manual)' : 'Gross (Shifts)'}</Text>
        </View>
        <Text variant="body" weight="semibold" tabularNums>
          {formattedGross}
        </Text>
      </Pressable>

      <View style={styles.divider} />

      {/* Row 2: Deductions */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon name="percent" size={18} tone="muted" />
          <Text variant="body">Deductions</Text>
        </View>
        <Text variant="body" weight="semibold" tabularNums>
          {`-${formattedTotalDeductions}`}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Row 3: Take-home Pay */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon name="credit-card" size={18} tone="muted" />
          <Text variant="body">Take-home Pay</Text>
        </View>
        <Text variant="body" weight="semibold" tabularNums>
          {formattedTakeHomePay}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
}));

