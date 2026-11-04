import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatCurrency, formatDayOrdinal } from '../../types';
import { GrossAndCutoffModal } from '../GrossAndCutoffModal';

export interface GrossPayHeroCardProps {
  readonly effectiveGrossPay: number;
  readonly autoGrossPay: number;
  readonly isManualGrossOverride: boolean;
  readonly paydayDayOfMonth: number;
  readonly workingShiftCount: number;
  readonly totalNetMinutes: number;
  readonly baseHourlyRate?: number | null | undefined;
  readonly netTakeHomePay: number;
  readonly totalTaxes: number;
  readonly finalRemainingBalance: number;
  readonly dailyAllowance: number;
  readonly onSaveGrossOverride: (amount: number | null) => void;
  readonly onSyncFromShifts?: (() => void) | undefined;
  readonly onSavePaydayCutoff: (day: number) => void;
  readonly onUpdateBaseHourlyRate?: ((rate: number) => void) | undefined;
  readonly onNavigateTemplates?: (() => void) | undefined;
}

export function GrossPayHeroCard({
  effectiveGrossPay,
  autoGrossPay,
  isManualGrossOverride,
  paydayDayOfMonth,
  workingShiftCount,
  totalNetMinutes,
  baseHourlyRate,
  netTakeHomePay,
  totalTaxes,
  finalRemainingBalance,
  dailyAllowance,
  onSaveGrossOverride,
  onSavePaydayCutoff,
  onUpdateBaseHourlyRate,
}: GrossPayHeroCardProps): ReactElement {
  const styles = useStyles();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const formattedFinalBalance = formatCurrency(finalRemainingBalance);
  const formattedDailySpend = formatCurrency(dailyAllowance);
  const formattedGross = formatCurrency(effectiveGrossPay);
  const formattedTotalTaxes = formatCurrency(totalTaxes);
  const formattedNetPay = formatCurrency(netTakeHomePay);
  const paydayLabel = `Payday: ${formatDayOrdinal(paydayDayOfMonth)}`;

  return (
    <View style={styles.card}>
      {/* Top Section: Remaining Balance Focus */}
      <View style={styles.topSection}>
        <View style={styles.topRow}>
          <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
            REMAINING BALANCE
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit gross earnings"
            onPress={() => setIsModalOpen(true)}
            style={({ pressed }) => [styles.paydayPill, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="calendar" size={12} tone="accent" />
            <Text variant="caption" weight="semibold" tone="accent" tabularNums>
              {paydayLabel}
            </Text>
          </Pressable>
        </View>
        <Text
          variant="display"
          weight="semibold"
          tone={finalRemainingBalance < 0 ? 'danger' : undefined}
          tabularNums
        >
          {formattedFinalBalance}
        </Text>
        <Text variant="caption" tone="muted" tabularNums>
          {`Safe to spend: ${formattedDailySpend} / day`}
        </Text>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* Bottom 3-Column Metrics Row */}
      <View style={styles.metricsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change payday cutoff, current ${paydayLabel}`}
          onPress={() => setIsModalOpen(true)}
          style={({ pressed }) => [styles.metricColumn, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <View style={styles.metricLabelRow}>
            <Text variant="caption" tone="muted">
              {isManualGrossOverride ? 'Gross (Manual)' : 'Gross (Shifts)'}
            </Text>
            <Icon name="edit-2" size={10} tone="muted" />
          </View>
          <Text variant="body" weight="semibold" tabularNums>
            {formattedGross}
          </Text>
        </Pressable>

        <View style={styles.metricDivider} />

        <View style={styles.metricColumn}>
          <Text variant="caption" tone="muted">
            Taxes
          </Text>
          <Text variant="body" weight="semibold" tone="danger" tabularNums>
            {`-${formattedTotalTaxes}`}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricColumn}>
          <Text variant="caption" tone="muted">
            Net Pay
          </Text>
          <Text variant="body" weight="semibold" tabularNums style={styles.successText}>
            {formattedNetPay}
          </Text>
        </View>
      </View>

      <GrossAndCutoffModal
        visible={isModalOpen}
        autoGrossPay={autoGrossPay}
        isManualGrossOverride={isManualGrossOverride}
        currentGrossPay={effectiveGrossPay}
        paydayDayOfMonth={paydayDayOfMonth}
        workingShiftCount={workingShiftCount}
        totalNetMinutes={totalNetMinutes}
        baseHourlyRate={baseHourlyRate}
        onSaveGrossOverride={onSaveGrossOverride}
        onSavePaydayCutoff={onSavePaydayCutoff}
        onUpdateBaseHourlyRate={onUpdateBaseHourlyRate}
        onClose={() => setIsModalOpen(false)}
      />
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
  topSection: { gap: theme.spacing.xs },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: { letterSpacing: 0.8 },
  paydayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    gap: theme.spacing.xs,
    alignItems: 'flex-start',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metricDivider: {
    width: theme.sizes.hairline,
    height: 32,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  successText: { color: theme.colors.success },
  pressed: { opacity: 0.7 },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
