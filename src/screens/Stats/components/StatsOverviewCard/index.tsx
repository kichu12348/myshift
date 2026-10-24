import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Card, Text, TextButton } from '@/components';
import { formatDurationHoursMinutes, type MonthlyStatsSummary } from '@/domain';
import { makeStyles } from '@/theme';

export interface StatsOverviewCardProps {
  readonly summary: MonthlyStatsSummary;
  readonly onNavigateTemplates?: (() => void) | undefined;
}

function formatCurrency(amount: number): string {
  const parts = amount.toFixed(2).split('.');
  const whole = parts[0] ?? '0';
  const decimal = parts[1] ?? '00';
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}.${decimal}`;
}

/**
 * Overview metrics card for working hours, shift count, and estimated earnings.
 */
export function StatsOverviewCard({
  summary,
  onNavigateTemplates,
}: StatsOverviewCardProps): ReactElement {
  const styles = useStyles();

  const netHoursFormatted = formatDurationHoursMinutes(summary.totalNetMinutes);
  const breakDeductedCaption =
    summary.totalBreakMinutes > 0
      ? `${formatDurationHoursMinutes(summary.totalBreakMinutes)} break deducted`
      : 'No break deductions';

  const offDaysCaption = `${summary.offDayCount} off ${summary.offDayCount === 1 ? 'day' : 'days'}`;

  return (
    <View style={styles.container}>
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text variant="caption" tone="muted">
            Net Hours
          </Text>
          <Text variant="display" weight="semibold" tabularNums>
            {netHoursFormatted}
          </Text>
          <Text variant="caption" tone="muted">
            {breakDeductedCaption}
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text variant="caption" tone="muted">
            Working Shifts
          </Text>
          <Text variant="display" weight="semibold" tabularNums>
            {String(summary.workingShiftCount)}
          </Text>
          <Text variant="caption" tone="muted">
            {offDaysCaption}
          </Text>
        </Card>
      </View>

      <Card style={styles.earningsCard}>
        <Text variant="caption" tone="muted">
          Estimated Earnings
        </Text>
        {summary.totalEstimatedEarnings !== null ? (
          <View style={styles.earningsContent}>
            <Text variant="display" weight="semibold" tabularNums>
              {formatCurrency(summary.totalEstimatedEarnings)}
            </Text>
            <Text variant="caption" tone="muted">
              Estimated before taxes & deductions
            </Text>
          </View>
        ) : (
          <View style={styles.noEarningsContainer}>
            <Text variant="bodySmall" tone="muted">
              Set hourly rates in Templates to track pay
            </Text>
            {onNavigateTemplates !== undefined ? (
              <TextButton
                label="Manage Templates"
                accessibilityLabel="Manage templates to set hourly rate"
                onPress={onNavigateTemplates}
              />
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  earningsCard: {
    gap: theme.spacing.xs,
  },
  earningsContent: {
    gap: theme.spacing.xs,
  },
  noEarningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
}));
