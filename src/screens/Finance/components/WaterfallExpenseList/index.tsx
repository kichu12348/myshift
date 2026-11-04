import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { MonthlyFinanceEntry, WaterfallItem } from '@/domain';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';
import { WaterfallStepItem } from './WaterfallStepItem';

export interface WaterfallExpenseListProps {
  readonly items: ReadonlyArray<WaterfallItem>;
  readonly onTogglePaid: (id: string) => void;
  readonly onAddItem?: (() => void) | undefined;
  readonly onManageTemplates?: (() => void) | undefined;
  readonly onPressItem?: ((item: MonthlyFinanceEntry) => void) | undefined;
}

export function WaterfallExpenseList({
  items,
  onTogglePaid,
  onAddItem,
  onManageTemplates,
  onPressItem,
}: WaterfallExpenseListProps): ReactElement {
  const styles = useStyles();

  const handleToggle = (id: string): void => {
    haptics.success();
    onTogglePaid(id);
  };

  return (
    <View style={styles.container}>
      {/* Section Header: Label + Add Item & Templates Actions */}
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          MONTHLY ALLOCATIONS & BILLS
        </Text>
        <View style={styles.headerActions}>
          {onManageTemplates !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage templates"
              onPress={onManageTemplates}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Text variant="caption" weight="semibold" tone="secondary">
                Templates
              </Text>
            </Pressable>
          ) : null}
          {onAddItem !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add item"
              onPress={onAddItem}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="plus" size={16} tone="accent" />
              <Text variant="caption" weight="semibold" tone="accent">
                Add Item
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Waterfall Steps */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text variant="caption" tone="muted">
            No bills or allocations added for this period.
          </Text>
        </View>
      ) : (
        items.map((step) => (
          <WaterfallStepItem
            key={step.entry.id}
            step={step}
            onTogglePaid={handleToggle}
            onPressItem={onPressItem}
          />
        ))
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
