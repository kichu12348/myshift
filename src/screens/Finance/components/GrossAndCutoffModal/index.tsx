import { useEffect, useState, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { DatePickerModal, Icon, Sheet, Text } from '@/components';
import {
  addMonths,
  formatDurationHoursMinutes,
  formatLocalDate,
  getMonthEndDate,
  getMonthStartDate,
  parseLocalDate,
  resolvePayPeriodDates,
  type LocalDate,
} from '@/domain';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';
import { formatCurrency } from '../../types';
import { EarningsSourceCard, type SourceMode } from './components/EarningsSourceCard';
import { PayPeriodDatesCard } from './components/PayPeriodDatesCard';

export interface GrossAndCutoffModalProps {
  readonly visible: boolean;
  readonly monthKey?: string | undefined;
  readonly periodStartDate?: string | undefined;
  readonly periodEndDate?: string | undefined;
  readonly autoGrossPay: number;
  readonly isManualGrossOverride: boolean;
  readonly currentGrossPay: number;
  readonly paydayDayOfMonth: number;
  readonly workingShiftCount: number;
  readonly totalNetMinutes: number;
  readonly baseHourlyRate?: number | null | undefined;
  readonly onSaveGrossOverride: (amount: number | null) => void;
  readonly onSavePaydayCutoff?: ((day: number) => void) | undefined;
  readonly onSavePayPeriodDates?: ((startDate: string, endDate: string) => void) | undefined;
  readonly onUpdateBaseHourlyRate?: ((rate: number) => void) | undefined;
  readonly onClose: () => void;
}

export function GrossAndCutoffModal({
  visible,
  monthKey,
  periodStartDate,
  periodEndDate,
  autoGrossPay,
  isManualGrossOverride,
  currentGrossPay,
  paydayDayOfMonth,
  workingShiftCount,
  totalNetMinutes,
  baseHourlyRate,
  onSaveGrossOverride,
  onSavePaydayCutoff,
  onSavePayPeriodDates,
  onUpdateBaseHourlyRate,
  onClose,
}: GrossAndCutoffModalProps): ReactElement {
  const styles = useStyles();

  const initialDates = monthKey
    ? resolvePayPeriodDates(monthKey, {
        monthKey,
        customStartDate: periodStartDate ?? null,
        customEndDate: periodEndDate ?? null,
        periodStartDate: periodStartDate ?? null,
        periodEndDate: periodEndDate ?? null,
        manualGrossOverride: null,
        notes: '',
      })
    : {
        startDate: periodStartDate ?? '2026-11-01',
        endDate: periodEndDate ?? '2026-11-30',
      };

  const [currentStartDate, setCurrentStartDate] = useState<string>(initialDates.startDate);
  const [currentEndDate, setCurrentEndDate] = useState<string>(initialDates.endDate);
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (visible) {
      if (periodStartDate) {
        setCurrentStartDate(periodStartDate);
      }
      if (periodEndDate) {
        setCurrentEndDate(periodEndDate);
      }
    }
  }, [visible, periodStartDate, periodEndDate]);

  const [sourceMode, setSourceMode] = useState<SourceMode>(() =>
    isManualGrossOverride ? 'manual' : 'auto',
  );
  const [manualAmount, setManualAmount] = useState<string>(() =>
    currentGrossPay > 0 ? String(currentGrossPay) : '',
  );
  const [hourlyRate, setHourlyRate] = useState<string>(() =>
    baseHourlyRate !== undefined && baseHourlyRate !== null && baseHourlyRate > 0
      ? String(baseHourlyRate)
      : '',
  );

  const formattedHours = formatDurationHoursMinutes(totalNetMinutes);
  const rateMultiplierText =
    hourlyRate.trim().length > 0 ? ` × $${hourlyRate}/hr` : '';
  const autoBreakdownText = `${workingShiftCount} shifts · ${formattedHours}${rateMultiplierText} = ${formatCurrency(autoGrossPay)}`;

  const handleSelectPayPeriodPreset = (preset: 'full' | '25th' | '20th'): void => {
    haptics.selection();
    const parts = monthKey ? monthKey.split('-') : ['2026', '11'];
    const ym = {
      year: Number(parts[0] ?? 2026),
      month: Number(parts[1] ?? 11),
    };

    if (preset === 'full') {
      setCurrentStartDate(getMonthStartDate(ym));
      setCurrentEndDate(getMonthEndDate(ym));
    } else if (preset === '25th') {
      const prevYm = addMonths(ym, -1);
      setCurrentStartDate(formatLocalDate(prevYm.year, prevYm.month, 26));
      const maxDays = parseLocalDate(getMonthEndDate(ym)).day;
      const endDay = Math.min(25, maxDays);
      setCurrentEndDate(formatLocalDate(ym.year, ym.month, endDay));
    } else if (preset === '20th') {
      const prevYm = addMonths(ym, -1);
      setCurrentStartDate(formatLocalDate(prevYm.year, prevYm.month, 21));
      const maxDays = parseLocalDate(getMonthEndDate(ym)).day;
      const endDay = Math.min(20, maxDays);
      setCurrentEndDate(formatLocalDate(ym.year, ym.month, endDay));
    }
  };

  const handleConfirmDate = (selected: LocalDate): void => {
    if (activeDatePicker === 'start') {
      if (selected > currentEndDate) {
        setCurrentEndDate(selected);
      }
      setCurrentStartDate(selected);
    } else if (activeDatePicker === 'end') {
      if (selected < currentStartDate) {
        setCurrentStartDate(selected);
      }
      setCurrentEndDate(selected);
    }
    setActiveDatePicker(null);
  };

  const handleSave = (): void => {
    haptics.success();
    if (sourceMode === 'auto') {
      onSaveGrossOverride(null);
    } else {
      const parsed = parseFloat(manualAmount);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onSaveGrossOverride(parsed);
      }
    }

    const derivedCutoffDay = parseLocalDate(currentEndDate as LocalDate).day;
    if (onSavePaydayCutoff !== undefined && derivedCutoffDay !== paydayDayOfMonth) {
      onSavePaydayCutoff(derivedCutoffDay);
    }

    if (
      onSavePayPeriodDates !== undefined &&
      (currentStartDate !== periodStartDate || currentEndDate !== periodEndDate)
    ) {
      onSavePayPeriodDates(currentStartDate, currentEndDate);
    }

    const parsedRate = parseFloat(hourlyRate);
    if (!Number.isNaN(parsedRate) && parsedRate > 0 && onUpdateBaseHourlyRate !== undefined) {
      onUpdateBaseHourlyRate(parsedRate);
    }

    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} showHandle={true}>
      <View style={styles.contentContainer}>
        {/* 1. Header */}
        <View style={styles.headerRow}>
          <Text variant="title" weight="semibold">
            Gross Pay & Cutoff
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="x" size={24} tone="text" />
          </Pressable>
        </View>
        <Text variant="bodySmall" tone="muted" style={styles.subtitle}>
          Configure shift earnings calculation and payday cycle.
        </Text>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* 2. Earnings Source Section */}
            <EarningsSourceCard
              sourceMode={sourceMode}
              onSelectMode={setSourceMode}
              autoGrossPay={autoGrossPay}
              autoBreakdownText={autoBreakdownText}
              hourlyRate={hourlyRate}
              onChangeHourlyRate={setHourlyRate}
              manualAmount={manualAmount}
              onChangeManualAmount={setManualAmount}
            />

            {/* 3. Pay Period Dates Section */}
            <PayPeriodDatesCard
              startDate={currentStartDate}
              endDate={currentEndDate}
              onChangeStartDate={setCurrentStartDate}
              onChangeEndDate={setCurrentEndDate}
              onSelectPreset={handleSelectPayPeriodPreset}
              onOpenDatePicker={(target) => setActiveDatePicker(target)}
            />

            {/* 4. Bottom Actions */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Override"
              onPress={handleSave}
              style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            >
              <Text variant="body" weight="semibold" tone="onAccent">
                Save Override
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text variant="bodySmall" weight="semibold" tone="muted">
                Cancel
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <DatePickerModal
        visible={activeDatePicker !== null}
        title={activeDatePicker === 'start' ? 'Select Start Date' : 'Select End Date (Payday)'}
        selectedDate={
          activeDatePicker === 'start'
            ? (currentStartDate as LocalDate)
            : (currentEndDate as LocalDate)
        }
        onConfirm={handleConfirmDate}
        onClose={() => setActiveDatePicker(null)}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  contentContainer: {
    flex: 1,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sheetScroll: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: -theme.spacing.sm,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.inputBoxHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
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
