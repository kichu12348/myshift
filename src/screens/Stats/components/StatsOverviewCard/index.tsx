import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
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
 * Bento-style hero metrics overview card for working hours, shift count, and estimated earnings.
 */
export function StatsOverviewCard({
  summary,
  onNavigateTemplates,
}: StatsOverviewCardProps): ReactElement {
  const styles = useStyles();

  const formattedNetHours = formatDurationHoursMinutes(summary.totalNetMinutes);
  const hasRate = summary.totalEstimatedEarnings !== null;
  const formattedPay = hasRate ? formatCurrency(summary.totalEstimatedEarnings) : '—';

  const baseRateText = useMemo(() => {
    if (summary.totalEstimatedEarnings === null) {
      return null;
    }
    if (summary.totalNetMinutes > 0) {
      const hourly = summary.totalEstimatedEarnings / (summary.totalNetMinutes / 60);
      return Number.isInteger(hourly) ? `$${hourly}/h` : `$${hourly.toFixed(2)}/h`;
    }
    return '$0/h';
  }, [summary.totalEstimatedEarnings, summary.totalNetMinutes]);

  const offDaysCaption = `${summary.offDayCount} ${summary.offDayCount === 1 ? 'day off' : 'days off'}`;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          MONTHLY OVERVIEW
        </Text>
      </View>

      {/* Top Row: 2 side-by-side Bento cards */}
      <View style={styles.topRow}>
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Icon name="clock" size={20} tone="accent" />
          </View>
          <View style={styles.heroContent}>
            <Text variant="title" weight="semibold" tabularNums>
              {formattedNetHours}
            </Text>
            <Text variant="caption" tone="muted">
              Net working hours
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Icon name="briefcase" size={20} tone="accent" />
          </View>
          <View style={styles.heroContent}>
            <Text variant="title" weight="semibold" tabularNums>
              {`${summary.workingShiftCount}`}
            </Text>
            <Text variant="caption" tone="muted" tabularNums>
              {offDaysCaption}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Row: Full-width Earnings Banner */}
      <View style={[styles.bannerCard, !hasRate && styles.bannerCardUnset]}>
        <View style={styles.badge}>
          <Icon name="dollar-sign" size={20} tone="accent" />
        </View>
        <View style={styles.centerStack}>
          <Text variant="caption" tone="muted">
            Estimated Earnings
          </Text>
          <Text variant="title" weight="semibold" tabularNums>
            {formattedPay}
          </Text>
        </View>
        <View style={styles.accessoryContainer}>
          {hasRate && baseRateText !== null ? (
            onNavigateTemplates !== undefined ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hourly rate: ${baseRateText}, manage templates`}
                onPress={onNavigateTemplates}
                style={({ pressed }) => [styles.ratePill, pressed && styles.pressed]}
                hitSlop={styles.hitSlop}
              >
                <Text variant="caption" weight="semibold" tabularNums tone="secondary">
                  {baseRateText}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.ratePill}>
                <Text variant="caption" weight="semibold" tabularNums tone="secondary">
                  {baseRateText}
                </Text>
              </View>
            )
          ) : onNavigateTemplates !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage templates to set hourly rate"
              onPress={onNavigateTemplates}
              style={({ pressed }) => [styles.setRatePill, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Text variant="caption" weight="semibold" tone="accent">
                Set rate
              </Text>
              <Icon name="chevron-right" size={12} tone="accent" />
            </Pressable>
          ) : (
            <View style={styles.setRatePill}>
              <Text variant="caption" weight="semibold" tone="muted">
                Set rate
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  heroCard: {
    flex: 1,
    minHeight: theme.sizes.statCardMinHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  heroContent: {
    gap: theme.spacing.xs,
  },
  badge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  bannerCardUnset: {
    borderStyle: 'dashed',
  },
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  accessoryContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ratePill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
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
