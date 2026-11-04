import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { daysBetween, isLocalDate, parseLocalDate } from '@/domain';
import { useToday } from '@/hooks';
import { makeStyles } from '@/theme';
import { formatCurrency, formatMonthDayRange } from '@/utils';
import { GrossAndCutoffModal } from '../GrossAndCutoffModal';

const SHORT_MONTHS: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface GrossPayHeroCardProps {
  readonly dailyAllowance: number;
  readonly paydayDayOfMonth: number;
  readonly effectiveGrossPay?: number | undefined;
  readonly autoGrossPay?: number | undefined;
  readonly isManualGrossOverride?: boolean | undefined;
  readonly workingShiftCount?: number | undefined;
  readonly totalNetMinutes?: number | undefined;
  readonly baseHourlyRate?: number | null | undefined;
  readonly netTakeHomePay?: number | undefined;
  readonly totalTaxes?: number | undefined;
  readonly finalRemainingBalance?: number | undefined;
  readonly effectiveStartDate?: string | undefined;
  readonly effectiveEndDate?: string | undefined;
  readonly onSaveGrossOverride?: ((amount: number | null) => void) | undefined;
  readonly onSyncFromShifts?: (() => void) | undefined;
  readonly onSavePaydayCutoff?: ((day: number) => void) | undefined;
  readonly onUpdateBaseHourlyRate?: ((rate: number) => void) | undefined;
  readonly onNavigateTemplates?: (() => void) | undefined;
  readonly onOpenCutoffModal?: (() => void) | undefined;
}

export function GrossPayHeroCard({
  dailyAllowance,
  paydayDayOfMonth,
  effectiveGrossPay = 0,
  autoGrossPay = 0,
  isManualGrossOverride = false,
  workingShiftCount = 0,
  totalNetMinutes = 0,
  baseHourlyRate,
  effectiveStartDate,
  effectiveEndDate,
  onSaveGrossOverride,
  onSavePaydayCutoff,
  onUpdateBaseHourlyRate,
  onOpenCutoffModal,
}: GrossPayHeroCardProps): ReactElement {
  const styles = useStyles();
  const today = useToday();
  const [internalModalOpen, setInternalModalOpen] = useState<boolean>(false);

  const formattedSafeDailySpend = formatCurrency(dailyAllowance);

  // Compute days to payday & formatted payday short label
  let daysToPayday = 0;
  let formattedPaydayShort = `Day ${paydayDayOfMonth}`;
  let activeDateRange = '';

  if (effectiveEndDate !== undefined && isLocalDate(effectiveEndDate)) {
    try {
      const parsedEnd = parseLocalDate(effectiveEndDate);
      const monthShort = SHORT_MONTHS[parsedEnd.month - 1] ?? '';
      formattedPaydayShort = `${monthShort} ${parsedEnd.day}`;
      daysToPayday = Math.max(0, daysBetween(today, effectiveEndDate));
    } catch {
      daysToPayday = 0;
    }
  }

  if (
    effectiveStartDate !== undefined &&
    effectiveEndDate !== undefined &&
    isLocalDate(effectiveStartDate) &&
    isLocalDate(effectiveEndDate)
  ) {
    try {
      activeDateRange = formatMonthDayRange(effectiveStartDate, effectiveEndDate);
    } catch {
      activeDateRange = '';
    }
  }

  const handleOpenModal = (): void => {
    if (onOpenCutoffModal !== undefined) {
      onOpenCutoffModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  return (
    <View style={styles.card}>
      {/* 2-Column Interior */}
      <View style={styles.contentRow}>
        {/* Left Column: Safe to spend */}
        <View style={styles.leftColumn}>
          <View style={styles.labelRow}>
            <Icon name="sun" size={16} tone="muted" />
            <Text variant="bodySmall" tone="muted">
              Safe to spend
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text variant="display" weight="semibold" tabularNums>
              {formattedSafeDailySpend}
            </Text>
            <Text variant="body" tone="muted">
              {' / day'}
            </Text>
          </View>
        </View>

        {/* Vertical Hairline Divider */}
        <View style={styles.divider} />

        {/* Right Column: Days to payday (Pressable -> opens GrossAndCutoffModal) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change payday cutoff, current Payday: ${formattedPaydayShort}`}
          onPress={handleOpenModal}
          style={({ pressed }) => [styles.rightColumn, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <View style={styles.paydayRow}>
            <Icon name="calendar" size={18} tone="primary" />
            <Text variant="bodySmall" weight="semibold" tabularNums numberOfLines={2}>
              {`${daysToPayday} days\nto payday`}
            </Text>
          </View>
          <Text variant="caption" tone="muted" tabularNums style={styles.paydayCaption}>
            {`Payday: ${formattedPaydayShort}`}
          </Text>
          {activeDateRange.length > 0 ? (
            <Text variant="caption" tone="muted" tabularNums>
              {activeDateRange}
            </Text>
          ) : null}
        </Pressable>
      </View>
      {onOpenCutoffModal === undefined && onSaveGrossOverride !== undefined ? (
        <GrossAndCutoffModal
          visible={internalModalOpen}
          autoGrossPay={autoGrossPay}
          isManualGrossOverride={isManualGrossOverride}
          currentGrossPay={effectiveGrossPay}
          paydayDayOfMonth={paydayDayOfMonth}
          workingShiftCount={workingShiftCount}
          totalNetMinutes={totalNetMinutes}
          baseHourlyRate={baseHourlyRate}
          onSaveGrossOverride={onSaveGrossOverride}
          onSavePaydayCutoff={onSavePaydayCutoff ?? (() => undefined)}
          onUpdateBaseHourlyRate={onUpdateBaseHourlyRate}
          onClose={() => setInternalModalOpen(false)}
        />
      ) : null}
    </View>
  );
}

export { GrossPayHeroCard as SafeToSpendHeroCard };

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.primary,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  divider: {
    width: theme.sizes.heroDividerWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  rightColumn: {
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  paydayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  paydayCaption: {
    marginTop: theme.spacing.xs,
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
