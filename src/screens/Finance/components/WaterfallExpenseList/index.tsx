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
    iconName === 'home'
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
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
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
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Text variant="caption" weight="semibold" tone="accent">
                + Add Item
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Grouped Card */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text variant="caption" tone="muted">
            No bills or allocations added for this period.
          </Text>
          {onCopyStructure !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy budget structure"
              onPress={onCopyStructure}
              style={({ pressed }) => [styles.emptyCopyButton, pressed && styles.pressed]}
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

            return (
              <View
                key={entry.id}
                style={[styles.row, index > 0 && styles.rowDivider]}
              >
                {/* Left: Tappable badge toggles isPaid */}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: entry.isPaid }}
                  accessibilityLabel={
                    entry.category === 'remittance'
                      ? entry.isPaid
                        ? 'Sent'
                        : 'Mark Sent'
                      : entry.isPaid
                        ? 'Paid'
                        : 'Mark Paid'
                  }
                  onPress={() => handleToggle(entry.id)}
                  style={({ pressed }) => [
                    styles.iconBadge,
                    { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                    pressed && styles.pressed,
                  ]}
                  hitSlop={styles.hitSlop}
                >
                  <Icon
                    name={entry.isPaid ? 'check' : iconName}
                    size={20}
                    color={resolvedColor}
                  />
                </Pressable>

                {/* Center: Name + running balance */}
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
                      <Text variant="caption" tone="muted">
                        Paid
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    tone={step.isOverdrawn ? 'danger' : 'muted'}
                    tabularNums
                  >
                    {`Balance after: ${formattedBalanceAfter}`}
                  </Text>
                </Pressable>

                {/* Right: Amount + chevron */}
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
  container: { gap: theme.spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionLabel: { letterSpacing: 0.8 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
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
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  rowDivider: {
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  centerStack: { flex: 1, gap: theme.spacing.xs },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 0,
  },
  pressed: { opacity: 0.7 },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
