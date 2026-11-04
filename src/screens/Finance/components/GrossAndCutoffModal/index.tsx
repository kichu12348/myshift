import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Icon, Sheet, Text, type IconName } from '@/components';
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

interface ModeSegment {
  readonly label: string;
  readonly value: SourceMode;
  readonly icon: IconName;
  readonly accessibilityLabel: string;
}

const MODE_SEGMENTS: readonly ModeSegment[] = [
  {
    label: 'Auto from Shifts',
    value: 'auto',
    icon: 'calendar',
    accessibilityLabel: 'Auto from shifts',
  },
  {
    label: 'Manual Gross',
    value: 'manual',
    icon: 'edit-3',
    accessibilityLabel: 'Manual gross pay override',
  },
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

  const handleSelectMode = (mode: SourceMode): void => {
    haptics.selection();
    setSourceMode(mode);
  };

  const handleSelectPreset = (day: number): void => {
    haptics.selection();
    setSelectedDay(day);
  };

  const handleSelectDay = (day: number): void => {
    haptics.selection();
    setSelectedDay(day);
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
    <Sheet visible={visible} onClose={onClose} showHandle={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetScroll}
        keyboardShouldPersistTaps="handled"
      >
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
            <Icon name="x" size={16} tone="muted" />
          </Pressable>
        </View>
        <Text variant="bodySmall" tone="muted" style={styles.subtitle}>
          Configure shift earnings calculation and payday cycle.
        </Text>

        {/* 2. Earnings Source 2-Segment Pill Bar */}
        <View style={styles.sectionBlock}>
          <Text variant="bodySmall" weight="semibold">
            Earnings Source
          </Text>
          <View style={styles.modeSegmentContainer}>
            {MODE_SEGMENTS.map((seg) => {
              const isSelected = sourceMode === seg.value;
              return (
                <Pressable
                  key={seg.value}
                  accessibilityRole="button"
                  accessibilityLabel={seg.accessibilityLabel}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelectMode(seg.value)}
                  style={[styles.modeSegment, isSelected && styles.modeSegmentSelected]}
                  hitSlop={styles.hitSlop}
                >
                  <Icon
                    name={seg.icon}
                    size={16}
                    color={isSelected ? theme.colors.onAccent : theme.colors.textMuted}
                  />
                  <Text
                    variant="caption"
                    weight={isSelected ? 'semibold' : 'regular'}
                    style={isSelected ? styles.onAccentText : styles.mutedText}
                  >
                    {seg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Source Mode Content */}
        {sourceMode === 'auto' ? (
          <>
            {/* Live Shift Pay Breakdown Card */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownLeft}>
                <Icon name="trending-up" size={20} color={theme.colors.success} />
                <View style={styles.breakdownTexts}>
                  <Text variant="caption" tone="muted">
                    Estimated Gross
                  </Text>
                  <Text variant="title" weight="semibold" style={styles.successText} tabularNums>
                    {formatCurrency(autoGrossPay)}
                  </Text>
                </View>
              </View>
              <Text variant="caption" tone="muted" tabularNums style={styles.breakdownCaption}>
                {autoBreakdownText}
              </Text>
            </View>

            {/* Base Hourly Rate Input */}
            <View style={styles.sectionBlock}>
              <Text variant="bodySmall" weight="semibold">
                Base Hourly Rate
              </Text>
              <View style={styles.inputBox}>
                <Text variant="title" tone="muted">
                  $
                </Text>
                <TextInput
                  style={[styles.textInput, styles.amountTextInput]}
                  placeholder="e.g. 25"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  accessibilityLabel="Base hourly rate"
                />
              </View>
              <Text variant="caption" tone="muted">
                Used to estimate earnings when shifts have no custom rate
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.sectionBlock}>
            <Text variant="bodySmall" weight="semibold">
              Manual Gross Pay
            </Text>
            <View style={styles.inputBox}>
              <Text variant="title" tone="muted">
                $
              </Text>
              <TextInput
                style={[styles.textInput, styles.amountTextInput]}
                placeholder={String(autoGrossPay)}
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                value={manualAmount}
                onChangeText={setManualAmount}
                accessibilityLabel="Gross earnings amount"
              />
            </View>
            <Text variant="caption" tone="muted">
              Enter exact monthly gross pay to override shift calculations
            </Text>
          </View>
        )}

        {/* 4. Payday Cutoff Day Section */}
        <View style={styles.sectionBlock}>
          <Text variant="bodySmall" weight="semibold">
            PAYDAY CUTOFF DAY
          </Text>
          <Text variant="caption" tone="muted">
            Count shifts and calculate payroll up to this day each month.
          </Text>

          {/* Quick Presets Strip */}
          <View style={styles.presetsStrip}>
            {PRESETS.map((p) => {
              const isSelected = selectedDay === p.day;
              return (
                <Pressable
                  key={p.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Preset ${p.label}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelectPreset(p.day)}
                  style={[styles.presetPill, isSelected && styles.presetPillSelected]}
                  hitSlop={styles.hitSlop}
                >
                  <Text
                    variant="caption"
                    weight={isSelected ? 'semibold' : 'regular'}
                    style={isSelected ? styles.onAccentText : styles.mutedText}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Day Number Strip */}
          <View style={styles.daysContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScroll}
            >
              {DAYS.map((day) => {
                const isSelected = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`Day ${formatDayOrdinal(day)}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelectDay(day)}
                    style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                    hitSlop={styles.hitSlop}
                  >
                    <Text
                      variant="bodySmall"
                      weight={isSelected ? 'semibold' : 'regular'}
                      style={isSelected ? styles.onAccentText : styles.dayNumberText}
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

        {/* 5. Bottom Actions */}
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
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  sheetScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: theme.sizes.closeButtonSize,
    height: theme.sizes.closeButtonSize,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: -theme.spacing.sm,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  modeSegmentContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.pillPaddingCompact,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeSegment: {
    flex: 1,
    height: theme.sizes.typeSegmentHeight,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  modeSegmentSelected: {
    backgroundColor: theme.colors.secondary,
  },
  onAccentText: {
    color: theme.colors.onAccent,
  },
  mutedText: {
    color: theme.colors.textMuted,
  },
  breakdownCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  breakdownTexts: {
    gap: theme.spacing.xs,
  },
  breakdownCaption: {
    alignSelf: 'flex-start',
  },
  successText: {
    color: theme.colors.success,
  },
  inputBox: {
    height: theme.sizes.inputBoxHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  amountTextInput: {
    fontSize: theme.typography.size.title,
    fontWeight: '600',
    fontVariant: theme.typography.fontVariant.tabularNums,
  },
  presetsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  presetPill: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.segmentedControlHeight,
  },
  presetPillSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  daysContainer: {
    marginTop: theme.spacing.xs,
  },
  daysScroll: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  dayButton: {
    width: theme.sizes.touchTarget - theme.spacing.xs,
    height: theme.sizes.touchTarget - theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  dayNumberText: {
    color: theme.colors.text,
  },
  ctaButton: {
    backgroundColor: theme.colors.secondary,
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
