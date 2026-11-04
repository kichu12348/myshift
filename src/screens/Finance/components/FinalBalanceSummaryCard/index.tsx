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
      {/* Top Header: Section Label & Overdrawn Alert */}
      <View style={styles.headerRow}>
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

      {/* Hero Display Amount */}
      <View style={styles.amountContainer}>
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

      {/* Two Ergonomic Bento Metric Blocks */}
      <View style={styles.bentoRow}>
        {/* Left Bento: Safe-to-Spend Daily Allowance */}
        <View style={styles.bentoCard}>
          <View style={styles.metricHeader}>
            <View style={styles.iconBadge}>
              <Icon name="sun" size={16} tone="muted" />
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Safe-to-Spend Daily
            </Text>
          </View>
          <Text variant="body" weight="semibold" tabularNums numberOfLines={1}>
            {formattedDaily}
          </Text>
        </View>

        {/* Right Bento: Unpaid Bills Remaining */}
        <View style={styles.bentoCard}>
          <View style={styles.metricHeader}>
            <View style={styles.iconBadge}>
              <Icon name="clock" size={16} tone="muted" />
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Unpaid Bills
            </Text>
          </View>
          <Text
            variant="body"
            weight="semibold"
            tone={unpaidBillsAmount > 0 ? 'warning' : 'muted'}
            tabularNums
            numberOfLines={1}
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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.error,
  },
  amountContainer: {
    paddingVertical: theme.spacing.xs,
  },
  balanceSuccess: {
    color: theme.colors.text,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: theme.sizes.touchTarget + 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
