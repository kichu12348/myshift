import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatCurrency } from '../../types';

export interface FinalBalanceSummaryCardProps {
  readonly finalRemainingBalance: number;
  readonly isOverdrawn: boolean;
  readonly dailyAllowance: number;
  readonly unpaidBillsAmount: number;
}

export function FinalBalanceSummaryCard({
  finalRemainingBalance,
  isOverdrawn,
  dailyAllowance,
  unpaidBillsAmount,
}: FinalBalanceSummaryCardProps): ReactElement {
  const styles = useStyles();

  const formattedRemaining = formatCurrency(finalRemainingBalance);
  const formattedDaily = `${formatCurrency(dailyAllowance)} / day`;
  const formattedUnpaid =
    unpaidBillsAmount > 0
      ? `${formatCurrency(unpaidBillsAmount)} left to pay`
      : 'All bills paid';

  return (
    <View style={styles.card}>
      {/* Top Section: Remaining Unallocated Balance Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
            REMAINING UNALLOCATED BALANCE
          </Text>
          {isOverdrawn ? (
            <View style={styles.alertBadge}>
              <Icon name="alert-triangle" size={12} tone="danger" />
              <Text variant="caption" weight="semibold" tone="danger">
                Overdrawn
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          variant="display"
          weight="semibold"
          tone={isOverdrawn ? 'danger' : undefined}
          style={!isOverdrawn ? styles.balanceSuccess : undefined}
          tabularNums
        >
          {formattedRemaining}
        </Text>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* Bottom Metrics Row */}
      <View style={styles.bottomRow}>
        {/* Left Metric: Safe-to-Spend Daily Allowance */}
        <View style={styles.metricBox}>
          <View style={styles.metricHeader}>
            <Icon name="sun" size={16} tone="muted" />
            <Text variant="caption" tone="muted">
              Safe-to-Spend Daily
            </Text>
          </View>
          <Text variant="body" weight="semibold" tabularNums>
            {formattedDaily}
          </Text>
        </View>

        {/* Right Metric: Unpaid Bills Remaining */}
        <View style={styles.metricBox}>
          <View style={styles.metricHeader}>
            <Icon name="clock" size={16} tone="muted" />
            <Text variant="caption" tone="muted">
              Unpaid Bills
            </Text>
          </View>
          <Text
            variant="body"
            weight="semibold"
            tone={unpaidBillsAmount > 0 ? 'warning' : 'muted'}
            tabularNums
          >
            {formattedUnpaid}
          </Text>
        </View>
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
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  heroSection: {
    gap: theme.spacing.xs,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.accentSoft,
  },
  balanceSuccess: {
    color: theme.colors.success,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricBox: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
