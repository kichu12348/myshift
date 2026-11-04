import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { isShiftIconName } from '@/constants/shiftIcons';
import type { MonthlyFinanceEntry, WaterfallItem } from '@/domain';
import {
  DEFAULT_SHIFT_COLOR,
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  useTheme,
} from '@/theme';
import { formatCurrency } from '../../types';

export interface WaterfallStepItemProps {
  readonly step: WaterfallItem;
  readonly onTogglePaid: (id: string) => void;
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

export function WaterfallStepItem({
  step,
  onTogglePaid,
  onPressItem,
}: WaterfallStepItemProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();
  const { entry } = step;

  const rawColor = entry.color || DEFAULT_SHIFT_COLOR;
  const resolvedColor = resolveShiftColor(rawColor, theme.mode);
  const iconName = resolveItemIcon(entry.icon);

  const shiftText = step.shiftsEquivalent > 0 ? ` · ~${step.shiftsEquivalent} shifts` : '';
  const subtitle =
    entry.valueMode === 'percentage'
      ? `${entry.value}% of gross${shiftText}`
      : `Fixed${shiftText}`;

  const formattedAmount = formatCurrency(step.computedAmount);
  const formattedBalanceAfter = formatCurrency(step.balanceAfter);

  const isRemittance = entry.category === 'remittance';
  const paidLabel = isRemittance
    ? entry.isPaid
      ? 'Sent'
      : 'Mark Sent'
    : entry.isPaid
      ? 'Paid'
      : 'Mark Paid';

  return (
    <View style={styles.stepContainer}>
      {/* Individual Item Card */}
      <Pressable
        disabled={onPressItem === undefined}
        accessibilityRole={onPressItem !== undefined ? 'button' : undefined}
        accessibilityLabel={`${entry.name}, ${subtitle}, minus ${formattedAmount}`}
        onPress={() => onPressItem?.(entry)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {/* Left: Squircle icon badge */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
          ]}
        >
          <Icon name={iconName} size={20} color={resolvedColor} />
        </View>

        {/* Center: Name & Category / shift-effort subtitle */}
        <View style={styles.centerStack}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {entry.name}
          </Text>
          <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right: Deducted amount & interactive Paid/Sent pill */}
        <View style={styles.rightStack}>
          <Text variant="body" weight="semibold" tabularNums>
            {`-${formattedAmount}`}
          </Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: entry.isPaid }}
            accessibilityLabel={paidLabel}
            onPress={() => onTogglePaid(entry.id)}
            style={({ pressed }) => [styles.paidPill, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon
              name={entry.isPaid ? 'check-circle' : 'circle'}
              size={12}
              color={entry.isPaid ? theme.colors.success : theme.colors.textMuted}
            />
            <Text
              variant="caption"
              weight="semibold"
              tone={entry.isPaid ? undefined : 'muted'}
              style={entry.isPaid ? styles.paidTextSuccess : undefined}
            >
              {paidLabel}
            </Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Running Balance Bar Below Each Card (The Waterfall Connector) */}
      <View style={styles.connectorStem} />
      <View
        style={[
          styles.balancePill,
          step.isOverdrawn ? styles.balancePillOverdrawn : styles.balancePillNormal,
        ]}
      >
        <Text variant="caption" tone="muted">
          {`Balance after ${entry.name}`}
        </Text>
        <Text
          variant="caption"
          weight="semibold"
          tone={step.isOverdrawn ? 'danger' : 'text'}
          tabularNums
        >
          {formattedBalanceAfter}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  stepContainer: {},
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  centerStack: { gap: theme.spacing.xs, flex: 1 },
  rightStack: { alignItems: 'flex-end', gap: theme.spacing.xs },
  paidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.sizes.size1,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    minHeight: theme.sizes.paidBadgeSize,
  },
  paidTextSuccess: { color: theme.colors.success },
  connectorStem: {
    height: theme.sizes.waterfallConnectorHeight,
    width: theme.sizes.waterfallConnectorWidth,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
  },
  balancePill: {
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balancePillNormal: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
  },
  balancePillOverdrawn: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.danger,
  },
  pressed: { opacity: 0.7 },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
