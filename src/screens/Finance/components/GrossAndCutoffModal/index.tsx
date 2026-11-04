import { useState, type ReactElement } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button, Icon, InlineSegmentedControl, Text } from '@/components';
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
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Header Row */}
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
              <Icon name="x" size={20} tone="muted" />
            </Pressable>
          </View>

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
                      <View style={styles.breakdownBox}>
                        <Icon name="calendar" size={16} tone="accent" />
                        <Text variant="caption" weight="semibold" tone="accent" style={styles.breakdownText}>
                          {autoBreakdownText}
                        </Text>
                      </View>
                      <View style={styles.rateRow}>
                        <View style={styles.rateLabelGroup}>
                          <Text variant="bodySmall" weight="semibold">
                            Base Hourly Rate
                          </Text>
                          <Text variant="caption" tone="muted">
                            Used to estimate shift pay
                          </Text>
                        </View>
                        <View style={styles.rateInputRow}>
                          <Text variant="body" weight="semibold" tone="muted">
                            $
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
                    </View>
                  ) : (
                    <View style={styles.manualContent}>
                      <Text variant="caption" tone="muted">
                        Enter exact monthly gross pay for this period:
                      </Text>
                      <View style={styles.currencyInputRow}>
                        <Text variant="title" weight="semibold" tone="muted">
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

            {/* Card 2: Payday Cutoff Day */}
            <View style={styles.sectionGroup}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
                PAYDAY CUTOFF DAY
              </Text>
              <View style={styles.card}>
                <View style={styles.cardPadded}>
                  <Text variant="caption" tone="muted">
                    Count shifts and calculate payroll up to this day each month.
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Quick Presets Strip */}
                <View style={styles.cardPadded}>
                  <Text variant="caption" tone="muted" weight="regular" style={styles.subLabel}>
                    Quick Presets
                  </Text>
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
                          hitSlop={styles.hitSlop}
                        >
                          <Text
                            variant="caption"
                            weight={isSelected ? 'semibold' : 'regular'}
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

                {/* Day Number Strip */}
                <View style={styles.cardPadded}>
                  <Text variant="caption" tone="muted" weight="regular" style={styles.subLabel}>
                    Or Select Day of Month
                  </Text>
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
                          hitSlop={styles.hitSlop}
                        >
                          <Text
                            variant="bodySmall"
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

            {/* Footer Actions */}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxHeight: '92%',
  },
  handle: {
    width: theme.sizes.sheetHandleWidth,
    height: theme.sizes.sheetHandleHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  closeButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionGroup: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.xs,
  },
  subLabel: {
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  autoContent: {
    gap: theme.spacing.md,
  },
  breakdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  breakdownText: {
    flex: 1,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rateLabelGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rateInputRow: {
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
  rateInput: {
    width: 60,
    minHeight: theme.sizes.touchTarget,
    color: theme.colors.text,
    textAlign: 'center',
  },
  manualContent: {
    gap: theme.spacing.sm,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget + 8,
  },
  currencyInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 22,
    minHeight: theme.sizes.touchTarget + 8,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  presetPill: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayCell: {
    minWidth: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  dayCellActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  footerRow: {
    gap: theme.spacing.sm,
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
