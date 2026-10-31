import type { ReactElement } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

const REMINDER_PRESETS: readonly { readonly minutes: number; readonly label: string }[] = [
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 60, label: '60m' },
  { minutes: 120, label: '2h' },
  { minutes: 1440, label: '24h' },
];

export interface ShiftRemindersAndNotesCardProps {
  readonly reminderOverride: number[] | null;
  readonly onChangeReminderOverride: (override: number[] | null) => void;
  readonly defaultOffsets: readonly number[];
  readonly notes: string;
  readonly onChangeNotes: (notes: string) => void;
  readonly isOff?: boolean | undefined;
}

export function ShiftRemindersAndNotesCard({
  reminderOverride,
  onChangeReminderOverride,
  defaultOffsets,
  notes,
  onChangeNotes,
  isOff = false,
}: ShiftRemindersAndNotesCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const isCustom = reminderOverride !== null;

  const handleToggleMode = (mode: 'default' | 'custom'): void => {
    haptics.selection();
    if (mode === 'default') {
      onChangeReminderOverride(null);
    } else {
      onChangeReminderOverride(defaultOffsets.length > 0 ? [...defaultOffsets] : [60, 30, 15]);
    }
  };

  const handleToggleOffset = (minutes: number): void => {
    haptics.selection();
    const current = reminderOverride ?? [];
    const exists = current.includes(minutes);
    const updated = exists
      ? current.filter((m) => m !== minutes)
      : [...current, minutes].sort((a, b) => b - a);
    onChangeReminderOverride(updated);
  };

  const formatSummary = (): string => {
    if (!isCustom) {
      return defaultOffsets.length > 0
        ? `Using default alerts (${defaultOffsets.map((m) => `${m}m`).join(', ')})`
        : 'Using default settings';
    }
    if (reminderOverride.length === 0) {
      return 'Muted \u00B7 No alerts for this shift';
    }
    return `Custom alerts (${reminderOverride.map((m) => `${m}m`).join(', ')})`;
  };

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        {isOff ? 'NOTES' : 'REMINDERS & NOTES'}
      </Text>

      <View style={styles.card}>
        {!isOff ? (
          <>
            <View style={styles.remindersHeaderRow}>
              <View style={styles.remindersMeta}>
                <Text variant="body" weight="semibold">
                  Alert Reminders
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {formatSummary()}
                </Text>
              </View>

              <View style={styles.modeToggleGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use default reminder settings"
                  accessibilityState={{ selected: !isCustom }}
                  onPress={() => handleToggleMode('default')}
                  style={[styles.modeButton, !isCustom && styles.modeButtonActive]}
                >
                  <Text variant="caption" weight="semibold" tone={!isCustom ? 'onAccent' : 'text'}>
                    Default
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use custom reminder settings"
                  accessibilityState={{ selected: isCustom }}
                  onPress={() => handleToggleMode('custom')}
                  style={[styles.modeButton, isCustom && styles.modeButtonActive]}
                >
                  <Text variant="caption" weight="semibold" tone={isCustom ? 'onAccent' : 'text'}>
                    Custom
                  </Text>
                </Pressable>
              </View>
            </View>

            {isCustom ? (
              <View style={styles.customOffsetsSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offsetsScroll}
                >
                  {REMINDER_PRESETS.map((preset) => {
                    const isSelected = reminderOverride.includes(preset.minutes);

                    return (
                      <Pressable
                        key={preset.minutes}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Alert ${preset.label} before`}
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => handleToggleOffset(preset.minutes)}
                        style={[styles.offsetPill, isSelected && styles.offsetPillActive]}
                      >
                        <Text
                          variant="caption"
                          weight="semibold"
                          tone={isSelected ? 'onAccent' : 'text'}
                          tabularNums
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.notesRow}>
          <Text variant="body" weight="semibold" style={styles.label}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="Add optional notes or assignment details"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
            accessibilityLabel="Shift notes"
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  remindersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    gap: theme.spacing.md,
  },
  remindersMeta: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    padding: theme.spacing.xs,
  },
  modeButton: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  customOffsetsSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  offsetsScroll: {
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  offsetPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  notesRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  label: {
    minWidth: theme.sizes.rowTextMinWidth,
  },
  notesInput: {
    minHeight: theme.sizes.inputMinHeight,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    textAlignVertical: 'top',
  },
}));
