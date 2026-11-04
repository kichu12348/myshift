import { useState, type ReactElement } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button, InlineSegmentedControl, Text } from '@/components';
import type { SegmentedOption } from '@/components/InlineSegmentedControl';
import { formatDurationHoursMinutes } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';
import { formatCurrency, formatDayOrdinal } from '../../types';

export interface GrossAndCutoffModalProps {
  readonly visible: boolean;
  readonly autoGrossPay: number;
  readonly isManualGrossOverride: boolean;
  readonly currentGrossPay: number;
  readonly paydayDayOfMonth: number;
  readonly workingShiftCount: number;
  readonly totalNetMinutes: number;
  readonly baseHourlyRate?: number | null | undefined;
  readonly onSaveGrossOverride: (amount: number | null) => void;
  readonly onSavePaydayCutoff: (day: number) => void;
  readonly onUpdateBaseHourlyRate?: ((rate: number) => void) | undefined;
  readonly onClose: () => void;
}

type SourceMode = 'auto' | 'manual';

const SOURCE_OPTIONS: readonly SegmentedOption<SourceMode>[] = [
  { label: 'Auto from Shifts', value: 'auto', accessibilityLabel: 'Auto from shifts' },
  { label: 'Manual Gross Pay', value: 'manual', accessibilityLabel: 'Manual gross pay override' },
];

const PRESETS: readonly { readonly label: string; readonly day: number }[] = [
  { label: '15th', day: 15 },
  { label: '25th', day: 25 },
  { label: '28th', day: 28 },
  { label: 'End of Month', day: 31 },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function GrossAndCutoffModal({
  visible,
  autoGrossPay,
  isManualGrossOverride,
  currentGrossPay,
  paydayDayOfMonth,
  workingShiftCount,
  totalNetMinutes,
  baseHourlyRate,
  onSaveGrossOverride,
  onSavePaydayCutoff,
  onUpdateBaseHourlyRate,
  onClose,
}: GrossAndCutoffModalProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const [sourceMode, setSourceMode] = useState<SourceMode>(() =>
    isManualGrossOverride ? 'manual' : 'auto',
  );
  const [manualAmount, setManualAmount] = useState<string>(() =>
    currentGrossPay > 0 ? String(currentGrossPay) : '',
  );
  const [selectedDay, setSelectedDay] = useState<number>(paydayDayOfMonth);
  const [hourlyRate, setHourlyRate] = useState<string>(() =>
    baseHourlyRate !== undefined && baseHourlyRate !== null && baseHourlyRate > 0
      ? String(baseHourlyRate)
      : '',
  );

  const formattedHours = formatDurationHoursMinutes(totalNetMinutes);
  const rateMultiplierText =
    hourlyRate.trim().length > 0 ? ` × $${hourlyRate}/hr` : '';
  const autoBreakdownText = `${workingShiftCount} shifts · ${formattedHours}${rateMultiplierText} = ${formatCurrency(autoGrossPay)}`;

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

    if (selectedDay !== paydayDayOfMonth) {
      onSavePaydayCutoff(selectedDay);
    }

    const parsedRate = parseFloat(hourlyRate);
    if (!Number.isNaN(parsedRate) && parsedRate > 0 && onUpdateBaseHourlyRate !== undefined) {
      onUpdateBaseHourlyRate(parsedRate);
    }

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss modal">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text variant="title" weight="semibold" style={styles.sheetTitle}>
            Gross Pay & Cutoff
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Card 1: Earnings Source */}
            <View style={styles.sectionGroup}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
                EARNINGS SOURCE
              </Text>
              <View style={styles.card}>
                <View style={styles.cardPadded}>
                  <InlineSegmentedControl
                    options={SOURCE_OPTIONS}
                    value={sourceMode}
                    onChange={setSourceMode}
                    accessibilityLabel="Earnings source"
                  />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardPadded}>
                  {sourceMode === 'auto' ? (
                    <View style={styles.autoContent}>
                      <Text variant="caption" weight="semibold" tone="accent">
                        {autoBreakdownText}
                      </Text>
                      <View style={styles.rateRow}>
                        <Text variant="caption" tone="muted">
                          Base Hourly Rate ($/hr):
                        </Text>
                        <TextInput
                          style={styles.rateInput}
                          placeholder="e.g. 25"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="decimal-pad"
                          value={hourlyRate}
                          onChangeText={setHourlyRate}
                          accessibilityLabel="Base hourly rate"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.manualContent}>
                      <Text variant="caption" tone="muted">
                        Enter exact monthly gross pay for this period:
                      </Text>
                      <View style={styles.currencyInputRow}>
                        <Text variant="body" weight="semibold" tone="muted">
                          $
                        </Text>
                        <TextInput
                          style={styles.currencyInput}
                          placeholder={String(autoGrossPay)}
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="decimal-pad"
                          value={manualAmount}
                          onChangeText={setManualAmount}
                          accessibilityLabel="Gross earnings amount"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Card 2: Payday Cutoff */}
            <View style={styles.sectionGroup}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
                PAYDAY CUTOFF DAY
              </Text>
              <View style={styles.card}>
                <View style={styles.cardPadded}>
                  <Text variant="caption" tone="muted">
                    Count shifts up to this day each month.
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardPadded}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stripRow}
                  >
                    {PRESETS.map((p) => {
                      const isSelected = selectedDay === p.day;
                      return (
                        <Pressable
                          key={p.label}
                          accessibilityRole="button"
                          accessibilityLabel={`Preset ${p.label}`}
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setSelectedDay(p.day)}
                          style={[styles.presetPill, isSelected && styles.presetPillActive]}
                        >
                          <Text
                            variant="caption"
                            weight="semibold"
                            tone={isSelected ? 'onAccent' : 'text'}
                          >
                            {p.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardPadded}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stripRow}
                  >
                    {DAYS.map((day) => {
                      const isSelected = day === selectedDay;
                      return (
                        <Pressable
                          key={day}
                          accessibilityRole="button"
                          accessibilityLabel={`Day ${formatDayOrdinal(day)}`}
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setSelectedDay(day)}
                          style={[styles.dayCell, isSelected && styles.dayCellActive]}
                        >
                          <Text
                            variant="caption"
                            weight={isSelected ? 'semibold' : 'regular'}
                            tone={isSelected ? 'onAccent' : 'text'}
                            tabularNums
                          >
                            {String(day)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Button label="Save Override" variant="primary" onPress={handleSave} />
              <Button label="Cancel" variant="secondary" onPress={onClose} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    width: theme.sizes.sheetHandleWidth,
    height: theme.sizes.sheetHandleHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: { marginBottom: theme.spacing.sm },
  scrollContent: { gap: theme.spacing.lg, paddingBottom: theme.spacing.md },
  sectionGroup: { gap: theme.spacing.xs },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: theme.spacing.xs },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardPadded: { padding: theme.spacing.md },
  cardDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  autoContent: { gap: theme.spacing.sm },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateInput: {
    width: theme.sizes.customBreakInputWidth,
    height: theme.sizes.touchTarget,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
  },
  manualContent: { gap: theme.spacing.sm },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
  },
  currencyInput: {
    flex: 1,
    color: theme.colors.text,
    minHeight: theme.sizes.touchTarget,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  presetPill: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    height: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayCell: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  footerRow: { gap: theme.spacing.sm },
}));
