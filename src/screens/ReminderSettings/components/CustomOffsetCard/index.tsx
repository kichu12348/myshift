import { useState, type ReactElement } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import {
  formatCompactDuration,
  formatTimeUntil,
  isValidOffset,
  MAX_REMINDER_OFFSET_MINUTES,
} from '@/domain';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

const PRESET_VALUES = new Set([15, 30, 60, 120, 720, 1440]);

export interface CustomOffsetCardProps {
  readonly remindersEnabled: boolean;
  readonly activeOffsets: readonly number[];
  readonly onAddOffset: (minutes: number) => void;
  readonly onRemoveOffset: (minutes: number) => void;
}

export function CustomOffsetCard({
  remindersEnabled,
  activeOffsets,
  onAddOffset,
  onRemoveOffset,
}: CustomOffsetCardProps): ReactElement {
  const styles = useStyles();
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const customOffsets = activeOffsets.filter((m) => !PRESET_VALUES.has(m)).sort((a, b) => b - a);

  const parsedInput = parseInt(customInput.trim(), 10);
  const livePreview =
    !Number.isNaN(parsedInput) && isValidOffset(parsedInput)
      ? `${formatTimeUntil(parsedInput)} before shift`
      : null;

  const handleAdd = (): void => {
    if (!isValidOffset(parsedInput)) {
      setCustomError(`Enter a valid whole number between 1 and ${MAX_REMINDER_OFFSET_MINUTES}`);
      haptics.warning();
      return;
    }

    if (activeOffsets.includes(parsedInput)) {
      setCustomError('Offset already active');
      haptics.warning();
      return;
    }

    setCustomError(null);
    setCustomInput('');
    onAddOffset(parsedInput);
  };

  const isAddDisabled = customInput.trim().length === 0 || !remindersEnabled;

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        CUSTOM REMINDER OFFSET
      </Text>
      <View style={[styles.card, !remindersEnabled && styles.cardDisabled]}>
        {customOffsets.map((offset) => {
          const badgeText = formatCompactDuration(offset);
          const formattedTitle = `${formatTimeUntil(offset)} before`;
          const subtitle = `${offset.toLocaleString()}m lead time`;

          return (
            <View key={`custom-${offset}`}>
              <View style={styles.row}>
                <View style={styles.badge}>
                  <Text
                    variant={badgeText.length > 4 ? 'micro' : 'caption'}
                    weight="semibold"
                    tone="accent"
                    tabularNums
                    numberOfLines={1}
                  >
                    {badgeText}
                  </Text>
                </View>
                <View style={styles.centerStack}>
                  <Text variant="body" weight="semibold">
                    {formattedTitle}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {subtitle}
                  </Text>
                </View>
                <IconButton
                  iconName="trash-2"
                  tone="muted"
                  disabled={!remindersEnabled}
                  onPress={() => onRemoveOffset(offset)}
                  accessibilityLabel={`Remove ${formatTimeUntil(offset)} reminder`}
                />
              </View>
              <View style={styles.divider} />
            </View>
          );
        })}

        <View style={styles.inputRow}>
          <View style={styles.iconBadge}>
            <Icon name="plus" size={20} tone="accent" />
          </View>
          <TextInput
            style={[styles.input, customError !== null && styles.inputError]}
            placeholder="Minutes (e.g. 45)"
            placeholderTextColor={styles.placeholder.color}
            keyboardType="number-pad"
            maxLength={4}
            value={customInput}
            editable={remindersEnabled}
            onChangeText={(text) => {
              setCustomInput(text);
              if (customError !== null) {
                setCustomError(null);
              }
            }}
            accessibilityLabel="Custom reminder minutes input"
          />
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              isAddDisabled ? styles.addButtonDisabled : pressed && styles.addButtonPressed,
            ]}
            onPress={handleAdd}
            disabled={isAddDisabled}
            hitSlop={styles.addHitSlop}
            accessibilityRole="button"
            accessibilityLabel="Add custom reminder interval"
          >
            <Text variant="bodySmall" weight="semibold" tone="onAccent">
              Add
            </Text>
          </Pressable>
        </View>

        {livePreview !== null ? (
          <View style={styles.previewContainer}>
            <Icon name="clock" size={12} tone="accent" />
            <Text variant="caption" tone="accent" weight="semibold">
              {livePreview}
            </Text>
          </View>
        ) : null}

        {customError !== null ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {customError}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => {
  const addHitSlopVertical = (theme.sizes.touchTarget - theme.sizes.segmentedControlHeight) / 2;

  return {
    container: {
      gap: theme.spacing.sm,
    },
    sectionHeader: {
      paddingHorizontal: theme.spacing.xs,
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: theme.sizes.hairline,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    cardDisabled: {
      opacity: 0.45,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: theme.sizes.settingsRowMinHeight,
      gap: theme.spacing.md,
    },
    badge: {
      width: theme.sizes.iconBadge,
      height: theme.sizes.iconBadge,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: theme.sizes.hairline,
      borderColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
    },
    iconBadge: {
      width: theme.sizes.iconBadge,
      height: theme.sizes.iconBadge,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerStack: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    divider: {
      height: theme.sizes.hairline,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
    },
    input: {
      flex: 1,
      height: theme.sizes.touchTarget,
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radius.md,
      borderWidth: theme.sizes.hairline,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.size.bodySmall,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    placeholder: {
      color: theme.colors.textMuted,
    },
    addButton: {
      height: theme.sizes.segmentedControlHeight,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonPressed: {
      opacity: 0.8,
    },
    addButtonDisabled: {
      opacity: 0.4,
    },
    addHitSlop: {
      top: addHitSlopVertical,
      bottom: addHitSlopVertical,
      left: theme.spacing.xs,
      right: theme.spacing.xs,
    },
    previewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    errorContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
  };
});
