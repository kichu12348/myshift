import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { isShiftIconName } from '@/constants/shiftIcons';
import type { MonthlyFinanceEntry, WaterfallItem } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme } from '@/theme';
import { formatCurrency } from '../../types';

export interface WaterfallExpenseListProps {
  readonly items: ReadonlyArray<WaterfallItem>;
  readonly unallocated: number;
  readonly onTogglePaid?: ((id: string) => void) | undefined;
  readonly onAddItem?: (() => void) | undefined;
  readonly onCopyStructure?: (() => void) | undefined;
  readonly onPressItem?: ((item: MonthlyFinanceEntry) => void) | undefined;
}

function resolveItemIcon(iconName: string): IconName {
  if (isShiftIconName(iconName)) {
    return iconName;
  }
  if (
    iconName === 'percent' ||
    iconName === 'home' ||
    iconName === 'tag' ||
    iconName === 'zap' ||
    iconName === 'credit-card' ||
    iconName === 'shopping-bag' ||
    iconName === 'gift' ||
    iconName === 'send' ||
    iconName === 'heart' ||
    iconName === 'shield' ||
    iconName === 'briefcase' ||
    iconName === 'wifi' ||
    iconName === 'more-horizontal' ||
    iconName === 'coffee' ||
    iconName === 'truck' ||
    iconName === 'layers'
  ) {
    return iconName;
  }
  return 'credit-card';
}

export function WaterfallExpenseList({
  items,
  unallocated,
  onTogglePaid,
  onAddItem,
  onCopyStructure,
  onPressItem,
}: WaterfallExpenseListProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const handleToggle = (id: string): void => {
    haptics.selection();
    onTogglePaid?.(id);
  };

  const formattedUnallocated = formatCurrency(unallocated);
  const isOverdrawn = unallocated < 0;

  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerTitles}>
          <Text variant="title" weight="semibold">
            Plan for this month
          </Text>
          <Text variant="caption" tone="muted">
            Deductions and allocations from your pay.
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {onCopyStructure !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy budget structure"
              onPress={onCopyStructure}
              style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="copy" size={16} tone="muted" />
            </Pressable>
          ) : null}

          {onAddItem !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add allocation"
              onPress={onAddItem}
              style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="plus" size={16} tone="primary" />
              <Text variant="bodySmall" weight="semibold">
                Add
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Grouped Allocations Card */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="layers" size={24} tone="muted" />
          <Text variant="caption" tone="muted">
            No deductions or allocations added for this month.
          </Text>
        </View>
      ) : (
        <View style={styles.allocationsCard}>
          {items.map((step, index) => {
            const { entry } = step;
            const iconName = resolveItemIcon(entry.icon);
            const formattedAmount = formatCurrency(step.computedAmount);
            const formattedBalanceAfter = formatCurrency(step.balanceAfter);
            const resolvedColor = resolveShiftColor(entry.color, theme.mode);

            const isRemittance = entry.category === 'remittance';
            const checkboxLabel = isRemittance
              ? entry.isPaid
                ? 'Sent'
                : 'Mark Sent'
              : entry.isPaid
                ? 'Paid'
                : 'Mark Paid';

            return (
              <View key={entry.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.itemRow}>
                  {/* Left: Standalone Icon (tappable to mark paid) */}
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: entry.isPaid }}
                    accessibilityLabel={checkboxLabel}
                    disabled={onTogglePaid === undefined}
                    onPress={() => handleToggle(entry.id)}
                    style={({ pressed }) => [
                      styles.iconPressable,
                      {
                        backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                      },
                      pressed && styles.pressed,
                    ]}
                    hitSlop={styles.hitSlop}
                  >
                    <Icon name={iconName} size={20} color={resolvedColor} />
                  </Pressable>

                  {/* Center & Right: Tappable to edit entry */}
                  <Pressable
                    style={styles.contentPressable}
                    disabled={onPressItem === undefined}
                    accessibilityRole={onPressItem !== undefined ? 'button' : undefined}
                    accessibilityLabel={`${entry.name}, minus ${formattedAmount}`}
                    onPress={() => onPressItem?.(entry)}
                  >
                    <View style={styles.centerStack}>
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {entry.name}
                      </Text>
                      <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
                        {entry.valueMode === 'percentage'
                          ? `${entry.value}% of gross`
                          : `Fixed · ${formattedBalanceAfter} left`}
                      </Text>
                    </View>

                    <View style={styles.rightGroup}>
                      <Text variant="body" weight="semibold" tabularNums>
                        {`-${formattedAmount}`}
                      </Text>
                      <Icon name="chevron-right" size={16} tone="muted" />
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Standalone Unallocated Card Directly Below */}
      <View style={styles.unallocatedCard}>
        <Icon name="layers" size={20} tone="muted" />
        <View style={styles.unallocatedCenter}>
          <Text variant="body" weight="semibold">
            Unallocated
          </Text>
          <Text variant="caption" tone="muted">
            Left to assign
          </Text>
        </View>
        <Text
          variant="title"
          weight="semibold"
          tone={isOverdrawn ? 'danger' : undefined}
          style={!isOverdrawn ? styles.unallocatedSuccess : undefined}
          tabularNums
        >
          {formattedUnallocated}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    gap: theme.spacing.xs,
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  copyButton: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPill: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  allocationsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  iconPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
  },
  contentPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  unallocatedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  unallocatedCenter: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  unallocatedSuccess: {
    color: theme.colors.success,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
