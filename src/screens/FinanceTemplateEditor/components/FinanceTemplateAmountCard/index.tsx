import type { ReactElement } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import type { FinanceValueMode } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

export interface FinanceTemplateAmountCardProps {
  readonly valueMode: FinanceValueMode;
  readonly onChangeValueMode: (mode: FinanceValueMode) => void;
  readonly value: string;
  readonly onChangeValue: (value: string) => void;
  readonly error?: string | undefined;
}

export function FinanceTemplateAmountCard({
  valueMode,
  onChangeValueMode,
  value,
  onChangeValue,
  error,
}: FinanceTemplateAmountCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const handleSelectMode = (mode: FinanceValueMode): void => {
    haptics.selection();
    onChangeValueMode(mode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="bodySmall" weight="semibold">
          Amount
        </Text>
        <View style={styles.toggleContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fixed amount"
            accessibilityState={{ selected: valueMode === 'fixed' }}
            onPress={() => handleSelectMode('fixed')}
            style={[styles.togglePill, valueMode === 'fixed' && styles.togglePillSelected]}
            hitSlop={styles.hitSlop}
          >
            <Text
              variant="caption"
              weight={valueMode === 'fixed' ? 'semibold' : 'regular'}
              style={valueMode === 'fixed' ? styles.onAccentText : styles.mutedText}
            >
              Fixed
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Percent amount"
            accessibilityState={{ selected: valueMode === 'percentage' }}
            onPress={() => handleSelectMode('percentage')}
            style={[styles.togglePill, valueMode === 'percentage' && styles.togglePillSelected]}
            hitSlop={styles.hitSlop}
          >
            <Text
              variant="caption"
              weight={valueMode === 'percentage' ? 'semibold' : 'regular'}
              style={valueMode === 'percentage' ? styles.onAccentText : styles.mutedText}
            >
              Percent
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.inputBox, error !== undefined && styles.inputBoxError]}>
        <Text variant="title" tone="muted">
          {valueMode === 'percentage' ? '%' : '$'}
        </Text>
        <TextInput
          style={[styles.textInput, styles.amountTextInput]}
          placeholder="0.00"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeValue}
          accessibilityLabel="Template amount"
        />
      </View>
      {error !== undefined ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.segmentedTrackPadding,
    flexDirection: 'row',
  },
  togglePill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillSelected: {
    backgroundColor: theme.colors.primary,
  },
  onAccentText: {
    color: theme.colors.onAccent,
  },
  mutedText: {
    color: theme.colors.textMuted,
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
  inputBoxError: {
    borderColor: theme.colors.error,
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
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));

