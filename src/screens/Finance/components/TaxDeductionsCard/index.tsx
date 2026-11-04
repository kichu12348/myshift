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
      {/* Section Header: Label + Add Tax Action */}
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          TAXES & DEDUCTIONS
        </Text>
        {onAddTax !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add tax"
            onPress={onAddTax}
            style={({ pressed }) => [styles.addTaxButton, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="plus" size={16} tone="accent" />
            <Text variant="caption" weight="semibold" tone="accent">
              Add Tax
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Grouped Surface Card */}
      <View style={styles.card}>
        <View style={styles.listContainer}>
          {taxItems.length === 0 ? (
            <View style={styles.emptyRow}>
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
                item.entry.valueMode === 'percentage' ? `${item.entry.value}%` : 'Fixed';
              const deductedText = `-${formatCurrency(item.computedAmount)}`;

              return (
                <Pressable
                  key={item.entry.id}
                  disabled={onPressTaxItem === undefined}
                  accessibilityRole={onPressTaxItem !== undefined ? 'button' : undefined}
                  accessibilityLabel={`${item.entry.name}, ${rateLabel}, ${deductedText}`}
                  onPress={() => onPressTaxItem?.(item.entry)}
                  style={({ pressed }) => [
                    styles.taxRow,
                    index > 0 && styles.rowDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.leftRowGroup}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                      ]}
                    >
                      <Icon name={iconName} size={16} color={resolvedColor} />
                    </View>
                    <View style={styles.nameAndRate}>
                      <Text variant="body" weight="semibold">
                        {item.entry.name}
                      </Text>
                      <View style={styles.ratePill}>
                        <Text variant="caption" tone="muted" tabularNums>
                          {rateLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text variant="body" weight="semibold" tabularNums>
                    {deductedText}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Attached Net Take-Home Banner */}
        <View style={styles.footerBanner}>
          <Text variant="bodySmall" weight="semibold">
            Net Take-Home Pay
          </Text>
          <Text variant="title" weight="semibold" tabularNums style={styles.netTakeHomeText}>
            {formattedNetTakeHome}
          </Text>
        </View>
      </View>
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
  addTaxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  emptyRow: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  rowDivider: {
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
  },
  leftRowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: theme.sizes.iconBadgeSmall,
    height: theme.sizes.iconBadgeSmall,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameAndRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  ratePill: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  footerBanner: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netTakeHomeText: { color: theme.colors.success },
  pressed: { opacity: 0.7 },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
