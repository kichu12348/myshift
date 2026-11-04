import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { MonthlyFinanceEntry, WaterfallItem } from '@/domain';
import {
  DEFAULT_SHIFT_COLOR,
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';
import { formatCurrency } from '../../types';

export interface TaxDeductionsCardProps {
  readonly taxItems: ReadonlyArray<WaterfallItem>;
  readonly netTakeHomePay: number;
  readonly onAddTax?: (() => void) | undefined;
  readonly onPressTaxItem?: ((item: MonthlyFinanceEntry) => void) | undefined;
}

function resolveTaxIcon(name: string): IconName {
  if (name === 'shield') {
    return 'shield';
  }
  return 'percent';
}

export function TaxDeductionsCard({
  taxItems,
  netTakeHomePay,
  onAddTax,
  onPressTaxItem,
}: TaxDeductionsCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const formattedNetTakeHome = formatCurrency(netTakeHomePay);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          TAXES & DEDUCTIONS
        </Text>
        {onAddTax !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add tax"
            onPress={onAddTax}
            style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="plus" size={16} tone="accent" />
            <Text variant="caption" weight="semibold" tone="accent">
              + Add Tax
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Grouped Surface Card */}
      <View style={styles.card}>
        {taxItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBadge}>
              <Icon name="percent" size={20} tone="muted" />
            </View>
            <Text variant="caption" tone="muted">
              No taxes or deductions added for this period.
            </Text>
          </View>
        ) : (
          taxItems.map((item, index) => {
            const rawColor = item.entry.color || DEFAULT_SHIFT_COLOR;
            const resolvedColor = resolveShiftColor(rawColor, theme.mode);
            const iconName = resolveTaxIcon(item.entry.icon);
            const rateLabel =
              item.entry.valueMode === 'percentage'
                ? `${item.entry.value}% of gross`
                : 'Fixed deduction';
            const deductedText = `-${formatCurrency(item.computedAmount)}`;

            return (
              <Pressable
                key={item.entry.id}
                disabled={onPressTaxItem === undefined}
                accessibilityRole={onPressTaxItem !== undefined ? 'button' : undefined}
                accessibilityLabel={`${item.entry.name}, ${rateLabel}, ${deductedText}`}
                onPress={() => onPressTaxItem?.(item.entry)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                  ]}
                >
                  <Icon name={iconName} size={20} color={resolvedColor} />
                </View>
                <View style={styles.centerStack}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {item.entry.name}
                  </Text>
                  <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
                    {rateLabel}
                  </Text>
                </View>
                <View style={styles.rightGroup}>
                  <Text variant="body" weight="semibold" tabularNums>
                    {deductedText}
                  </Text>
                  <Icon name="chevron-right" size={16} tone="muted" />
                </View>
              </Pressable>
            );
          })
        )}

        {/* Net Take-Home Pay Banner */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Icon name="shield" size={16} tone="accent" />
            <Text variant="bodySmall" weight="semibold">
              Net Take-Home Pay
            </Text>
          </View>
          <Text variant="title" weight="semibold" tabularNums style={styles.netText}>
            {formattedNetTakeHome}
          </Text>
        </View>
      </View>
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
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
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
  iconBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  footer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  netText: {
    color: theme.colors.success,
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
