import type { ReactElement } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icon, Text, type IconName } from '@/components';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';
import { formatCurrency } from '../../../../types';

export type SourceMode = 'auto' | 'manual';

export interface EarningsSourceCardProps {
  readonly sourceMode: SourceMode;
  readonly onSelectMode: (mode: SourceMode) => void;
  readonly autoGrossPay: number;
  readonly autoBreakdownText: string;
  readonly hourlyRate: string;
  readonly onChangeHourlyRate: (rate: string) => void;
  readonly manualAmount: string;
  readonly onChangeManualAmount: (amount: string) => void;
}

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

export function EarningsSourceCard({
  sourceMode,
  onSelectMode,
  autoGrossPay,
  autoBreakdownText,
  hourlyRate,
  onChangeHourlyRate,
  manualAmount,
  onChangeManualAmount,
}: EarningsSourceCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const handleSelectMode = (mode: SourceMode): void => {
    haptics.selection();
    onSelectMode(mode);
  };

  return (
    <View style={styles.container}>
      {/* 2-Segment Pill Bar */}
      <View style={styles.sectionBlock}>
        <Text variant="bodySmall" weight="semibold">
          Earnings Source
        </Text>
        <View style={styles.typeSegmentContainer}>
          {MODE_SEGMENTS.map((seg) => {
            const isSelected = sourceMode === seg.value;
            return (
              <Pressable
                key={seg.value}
                accessibilityRole="button"
                accessibilityLabel={seg.accessibilityLabel}
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectMode(seg.value)}
                style={[styles.typeSegment, isSelected && styles.typeSegmentSelected]}
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

      {/* Mode Specific Content */}
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
            <Text variant="caption" tone="muted" tabularNums style={styles.equationText}>
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
                onChangeText={onChangeHourlyRate}
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
              onChangeText={onChangeManualAmount}
              accessibilityLabel="Gross earnings amount"
            />
          </View>
          <Text variant="caption" tone="muted">
            Enter exact monthly gross pay to override shift calculations
          </Text>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  typeSegmentContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.pillPaddingCompact,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeSegment: {
    flex: 1,
    height: theme.sizes.typeSegmentHeight,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  typeSegmentSelected: {
    backgroundColor: theme.colors.primary,
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
  equationText: {
    alignSelf: 'flex-start',
  },
  successText: {
    color: theme.colors.success,
  },
  inputBox: {
    height: theme.sizes.inputBoxHeight,
    backgroundColor: theme.colors.surfaceRaised,
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

