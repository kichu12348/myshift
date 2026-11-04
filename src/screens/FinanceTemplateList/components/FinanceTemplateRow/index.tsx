import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { FinanceTemplate } from '@/domain';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatCurrency } from '@/utils';

export interface FinanceTemplateRowProps {
  readonly template: FinanceTemplate;
  readonly onPress: () => void;
}

export function FinanceTemplateRow({ template, onPress }: FinanceTemplateRowProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = resolveShiftColor(template.color, theme.mode);
  const subtitle =
    template.valueMode === 'percentage'
      ? `${template.value}% of gross`
      : `Fixed · ${formatCurrency(template.value)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${template.name} template`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View
        style={[styles.iconBadge, { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` }]}
      >
        <Icon name={template.icon as IconName} size={20} color={resolvedColor} />
      </View>

      <View style={styles.center}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {template.name}
        </Text>
        <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.dot, { backgroundColor: resolvedColor }]} />
        <Icon name="chevron-right" size={16} tone="muted" />
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceRaised,
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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: theme.sizes.templateDot,
    height: theme.sizes.templateDot,
    borderRadius: theme.radius.full,
  },
}));

