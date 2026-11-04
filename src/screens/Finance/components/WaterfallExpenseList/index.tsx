import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { isShiftIconName } from '@/constants/shiftIcons';
import type { MonthlyFinanceEntry, WaterfallItem } from '@/domain';
import { haptics } from '@/services';
import {
  DEFAULT_SHIFT_COLOR,
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';
import { formatCurrency } from '../../types';

export interface WaterfallExpenseListProps {
  readonly items: ReadonlyArray<WaterfallItem>;
  readonly onTogglePaid: (id: string) => void;
  readonly onAddItem?: (() => void) | undefined;
  readonly onManageTemplates?: (() => void) | undefined;
  readonly onCopyStructure?: (() => void) | undefined;
  readonly onPressItem?: ((item: MonthlyFinanceEntry) => void) | undefined;
}

function resolveItemIcon(iconName: string): IconName {
  if (isShiftIconName(iconName)) {
    return iconName;
  }
  if (
    iconName === 'credit-card' ||
    iconName === 'dollar-sign' ||
    iconName === 'shopping-bag' ||
    iconName === 'gift' ||
    iconName === 'home' ||
    iconName === 'send' ||
    iconName === 'heart'
  ) {
    return iconName;
  }
  return 'credit-card';
}

export function WaterfallExpenseList({
  items,
  onTogglePaid,
  onAddItem,
  onCopyStructure,
  onPressItem,
}: WaterfallExpenseListProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const handleToggle = (id: string): void => {
    haptics.selection();
    onTogglePaid(id);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          MONTHLY ALLOCATIONS
        </Text>
        <View style={styles.headerActions}>
          {onCopyStructure !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy budget structure"
              onPress={onCopyStructure}
              style={({ pressed }) => [styles.secondaryPill, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="copy" size={16} tone="muted" />
              <Text variant="caption" weight="semibold" tone="muted">
                Copy Month
              </Text>
            </Pressable>
          ) : null}
          {onAddItem !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add item"
              onPress={onAddItem}
              style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="plus" size={16} tone="accent" />
              <Text variant="caption" weight="semibold" tone="accent">
                + Add Item
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Grouped Surface Card */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyBadge}>
            <Icon name="layers" size={20} tone="muted" />
          </View>
          <Text variant="caption" tone="muted">
            No bills or allocations added for this period.
          </Text>
          {onCopyStructure !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy budget structure"
              onPress={onCopyStructure}
              style={({ pressed }) => [styles.emptyCopyButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="copy" size={16} tone="accent" />
              <Text variant="caption" weight="semibold" tone="accent">
                Copy Structure
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          {items.map((step, index) => {
            const { entry } = step;
            const rawColor = entry.color || DEFAULT_SHIFT_COLOR;
            const resolvedColor = resolveShiftColor(rawColor, theme.mode);
            const iconName = resolveItemIcon(entry.icon);
            const formattedAmount = formatCurrency(step.computedAmount);
            const formattedBalanceAfter = formatCurrency(step.balanceAfter);

            const isRemittance = entry.category === 'remittance';
            const checkboxLabel = isRemittance
              ? entry.isPaid
                ? 'Sent'
                : 'Mark Sent'
              : entry.isPaid
                ? 'Paid'
                : 'Mark Paid';

            return (
              <View key={entry.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                {/* Left: Interactive Checkbox / Status Badge */}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: entry.isPaid }}
                  accessibilityLabel={checkboxLabel}
                  onPress={() => handleToggle(entry.id)}
                  style={({ pressed }) => [
                    styles.checkboxTouchTarget,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={styles.hitSlop}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                      entry.isPaid && styles.iconBadgePaid,
                    ]}
                  >
                    <Icon
                      name={entry.isPaid ? 'check' : iconName}
                      size={18}
                      color={entry.isPaid ? theme.colors.success : resolvedColor}
                    />
                  </View>
                </Pressable>

                {/* Center: Name & Running Balance */}
                <Pressable
                  style={styles.centerStack}
                  disabled={onPressItem === undefined}
                  accessibilityRole={onPressItem !== undefined ? 'button' : undefined}
                  accessibilityLabel={`${entry.name}, minus ${formattedAmount}`}
                  onPress={() => onPressItem?.(entry)}
                >
                  <View style={styles.nameRow}>
                    <Text variant="body" weight="semibold" numberOfLines={1}>
                      {entry.name}
                    </Text>
                    {entry.isPaid ? (
                      <View style={styles.paidPill}>
                        <Text variant="caption" weight="semibold" style={styles.paidText}>
                          Paid
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    tone={step.isOverdrawn ? 'danger' : 'muted'}
                    tabularNums
                    numberOfLines={1}
                  >
                    {`Balance after: ${formattedBalanceAfter}`}
                  </Text>
                </Pressable>

                {/* Right: Deducted Amount + Chevron */}
                <Pressable
                  disabled={onPressItem === undefined}
                  onPress={() => onPressItem?.(entry)}
                  style={styles.rightGroup}
                  hitSlop={styles.hitSlop}
                >
                  <Text variant="body" weight="semibold" tabularNums>
                    {`-${formattedAmount}`}
                  </Text>
                  <Icon name="chevron-right" size={16} tone="muted" />
                </Pressable>
              </View>
            );
          })}
        </View>
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
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  secondaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    minHeight: theme.sizes.touchTarget,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.settingsRowMinHeight,
  },
  rowDivider: {
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
  },
  checkboxTouchTarget: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgePaid: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  paidPill: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceRaised,
  },
  paidText: {
    color: theme.colors.success,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 0,
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
