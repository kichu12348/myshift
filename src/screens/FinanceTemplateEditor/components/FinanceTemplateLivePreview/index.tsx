import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { FinanceRuleType, FinanceValueMode } from '@/domain';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatCurrency } from '@/utils';

export interface FinanceTemplateLivePreviewProps {
  readonly name: string;
  readonly category: FinanceRuleType;
  readonly valueMode: FinanceValueMode;
  readonly value: number;
  readonly icon: string;
  readonly color: string;
}

export function FinanceTemplateLivePreview({
  name,
  valueMode,
  value,
  icon,
  color,
}: FinanceTemplateLivePreviewProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = resolveShiftColor(color, theme.mode);
  const displayName = name.trim().length > 0 ? name.trim() : 'Template Name';
  const subtitle =
    valueMode === 'percentage'
      ? `${value}% of gross`
      : `Fixed · ${formatCurrency(value)}`;

  return (
    <View style={styles.card}>
      <View
        style={[styles.iconBadge, { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` }]}
      >
        <Icon name={icon as IconName} size={20} color={resolvedColor} />
      </View>

      <View style={styles.center}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {displayName}
        </Text>
        <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.dot, { backgroundColor: resolvedColor }]} />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  dot: {
    width: theme.sizes.templateDot,
    height: theme.sizes.templateDot,
    borderRadius: theme.radius.full,
  },
}));

