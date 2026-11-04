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
  const isOverdrawn = finalRemainingBalance < 0;

  return (
    <View style={styles.card}>
      {/* Top Header: Section Label & Ergonomic Payday Pill */}
      <View style={styles.headerRow}>
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
          <Icon name="calendar" size={16} tone="accent" />
          <Text variant="caption" weight="semibold" tone="accent" tabularNums>
            {paydayLabel}
          </Text>
        </Pressable>
      </View>

      {/* Hero Remaining Balance */}
      <View style={styles.heroSection}>
        <Text
          variant="display"
          weight="semibold"
          tone={isOverdrawn ? 'danger' : undefined}
          style={!isOverdrawn ? styles.balanceSuccess : undefined}
          tabularNums
        >
          {formattedFinalBalance}
        </Text>
        <View style={styles.safeSpendRow}>
          <Icon name="sun" size={16} tone="muted" />
          <Text variant="caption" tone="muted" tabularNums>
            {`Safe to spend: ${formattedDailySpend} / day`}
          </Text>
        </View>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* 3-Column Ergonomic Flow Grid: Gross -> Taxes -> Net */}
      <View style={styles.metricsRow}>
        {/* Gross Earnings Block (Tappable to adjust cutoff/gross) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change payday cutoff, current ${paydayLabel}`}
          onPress={() => setIsModalOpen(true)}
          style={({ pressed }) => [styles.metricBlock, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <View style={styles.metricLabelRow}>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {isManualGrossOverride ? 'Gross (Manual)' : 'Gross (Shifts)'}
            </Text>
            <Icon name="edit-2" size={12} tone="muted" />
          </View>
          <Text variant="body" weight="semibold" tabularNums numberOfLines={1}>
            {formattedGross}
          </Text>
        </Pressable>

        {/* Taxes Deductions Block */}
        <View style={styles.metricBlock}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            Taxes
          </Text>
          <Text variant="body" weight="semibold" tone="danger" tabularNums numberOfLines={1}>
            {`-${formattedTotalTaxes}`}
          </Text>
        </View>

        {/* Net Take-Home Pay Block */}
        <View style={styles.metricBlock}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            Net Pay
          </Text>
          <Text
            variant="body"
            weight="semibold"
            tabularNums
            style={styles.netSuccessText}
            numberOfLines={1}
          >
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  paydayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  heroSection: {
    gap: theme.spacing.xs,
  },
  balanceSuccess: {
    color: theme.colors.text,
  },
  safeSpendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: theme.sizes.touchTarget + 6,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  netSuccessText: {
    color: theme.colors.success,
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
