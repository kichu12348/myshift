import type { ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { RotationPatternEntry, ShiftTemplate } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme } from '@/theme';

export interface CycleSequenceCardProps {
  readonly pattern: readonly RotationPatternEntry[];
  readonly templatesById: ReadonlyMap<string, ShiftTemplate>;
  readonly onRemoveSlot: (index: number) => void;
  readonly onRemoveLast: () => void;
  readonly onClearAll: () => void;
}

export function CycleSequenceCard({
  pattern,
  templatesById,
  onRemoveSlot,
  onRemoveLast,
  onClearAll,
}: CycleSequenceCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold">
        {`CYCLE SEQUENCE (${pattern.length} DAYS)`}
      </Text>
      <View style={styles.card}>
        {pattern.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodySmall" tone="muted">
              Tap templates below to build your repeating cycle
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slotsRow}
            >
              {pattern.map((entry, index) => {
                const template = entry !== null ? templatesById.get(entry) : undefined;
                const rawColor = template?.color ?? theme.colors.textMuted;
                const resolvedColor = resolveShiftColor(rawColor, theme.mode);
                const iconName =
                  template !== undefined && isShiftIconName(template.icon)
                    ? template.icon
                    : DEFAULT_SHIFT_ICON;
                const templateName = template?.name ?? 'Off';

                return (
                  <Pressable
                    key={`slot-${index}`}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                        borderColor: resolvedColor,
                      },
                    ]}
                    onPress={() => {
                      haptics.selection();
                      onRemoveSlot(index);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove Day ${index + 1} (${templateName})`}
                  >
                    <Text variant="micro" tone="muted" tabularNums>
                      {`Day ${index + 1}`}
                    </Text>
                    <Icon name={iconName} size={18} color={resolvedColor} />
                    <Text
                      variant="micro"
                      weight="semibold"
                      numberOfLines={1}
                      ellipsizeMode="clip"
                      style={{ color: resolvedColor }}
                    >
                      {templateName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  haptics.selection();
                  onRemoveLast();
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove last day from sequence"
              >
                <Icon name="delete" size={16} tone="muted" />
                <Text variant="caption" weight="semibold" tone="muted">
                  Remove Last
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  haptics.warning();
                  onClearAll();
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear rotation cycle pattern"
              >
                <Icon name="trash-2" size={16} tone="danger" />
                <Text variant="caption" weight="semibold" tone="danger">
                  Clear All
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsRow: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  slot: {
    width: theme.sizes.cycleSlotWidth,
    height: theme.sizes.cycleSlotHeight,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    paddingHorizontal: theme.spacing.sm,
  },
}));
