import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

const BREAK_PRESETS = [0, 15, 20, 30, 45, 60, 90] as const;

export interface BreakDurationPickerProps {
  readonly breakMinutes: number;
  readonly onChangeBreakMinutes: (minutes: number) => void;
  readonly error?: string | undefined;
}

export function BreakDurationPicker({
  breakMinutes,
  onChangeBreakMinutes,
  error,
}: BreakDurationPickerProps): ReactElement {
  const styles = useStyles();

  const isPreset = (BREAK_PRESETS as readonly number[]).includes(breakMinutes);
  const [isCustomOpen, setIsCustomOpen] = useState(!isPreset);

  useEffect(() => {
    if (!isPreset) {
      setIsCustomOpen(true);
    }
  }, [isPreset]);

  const isCustomActive = isCustomOpen || !isPreset;

  const handleSelectPreset = (mins: number): void => {
    haptics.selection();
    setIsCustomOpen(false);
    onChangeBreakMinutes(mins);
  };

  const handleToggleCustom = (): void => {
    haptics.selection();
    setIsCustomOpen(true);
  };

  const handleCustomTextChange = (text: string): void => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) {
      onChangeBreakMinutes(0);
      return;
    }
    const parsed = parseInt(cleaned, 10);
    const clamped = Math.min(480, Math.max(0, Number.isNaN(parsed) ? 0 : parsed));
    onChangeBreakMinutes(clamped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="body" weight="semibold">
          Unpaid Break
        </Text>
        <Text variant="caption" tone="muted" tabularNums>
          {`${breakMinutes}m`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BREAK_PRESETS.map((mins) => {
          const isSelected = !isCustomActive && breakMinutes === mins;

          return (
            <Pressable
              key={mins}
              accessibilityRole="button"
              accessibilityLabel={`Break ${mins} minutes`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelectPreset(mins)}
              style={[styles.breakPill, isSelected && styles.breakPillActive]}
            >
              <Text
                variant="caption"
                weight="semibold"
                tone={isSelected ? 'onAccent' : 'text'}
                tabularNums
              >
                {`${mins}m`}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Custom break duration"
          accessibilityState={{ selected: isCustomActive }}
          onPress={handleToggleCustom}
          style={[styles.breakPill, styles.customPill, isCustomActive && styles.breakPillActive]}
        >
          <Icon name="edit-2" size={12} tone={isCustomActive ? 'onAccent' : 'muted'} />
          <Text variant="caption" weight="semibold" tone={isCustomActive ? 'onAccent' : 'text'}>
            Custom
          </Text>
        </Pressable>
      </ScrollView>

      {isCustomActive ? (
        <View style={styles.customRow}>
          <Text variant="bodySmall" tone="muted">
            Custom break (minutes)
          </Text>

          <View style={styles.customInputContainer}>
            <TextInput
              keyboardType="number-pad"
              maxLength={3}
              value={String(breakMinutes)}
              onChangeText={handleCustomTextChange}
              accessibilityLabel="Custom break minutes"
              style={styles.customTextInput}
            />
            <Text variant="caption" tone="muted">
              m
            </Text>
          </View>
        </View>
      ) : null}

      {error !== undefined ? (
        <View style={styles.errorContainer}>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  breakPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPill: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  breakPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  customInputContainer: {
    width: theme.sizes.customBreakInputWidth,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
  },
  customTextInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    paddingVertical: theme.spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.md,
  },
}));
