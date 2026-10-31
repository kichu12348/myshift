import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { isShiftIconName } from '@/constants';
import type { ShiftTemplate } from '@/domain';
import { resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme, makeStyles } from '@/theme';

export interface TwoWeekRibbonProps {
  readonly pattern: readonly (string | null)[];
  readonly templates: readonly ShiftTemplate[];
  readonly isVariable: boolean;
}

export function TwoWeekRibbon({
  pattern,
  templates,
  isVariable,
}: TwoWeekRibbonProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const getTemplateForDay = (dayIndex: number): ShiftTemplate | undefined => {
    if (isVariable || pattern.length === 0) {
      return undefined;
    }
    const templateId = pattern[dayIndex % pattern.length];
    if (!templateId) {
      return undefined;
    }
    return templates.find((t) => t.id === templateId);
  };

  const days = Array.from({ length: 14 }, (_, i) => i);

  return (
    <View style={styles.card} accessibilityLabel="14-day schedule pattern preview ribbon">
      <View style={styles.headerRow}>
        <Icon name="repeat" size={16} tone="secondary" />
        <Text variant="caption" weight="semibold" tone="text">
          14-DAY ROTATION RIBBON PREVIEW
        </Text>
      </View>

      <View style={styles.grid}>
        {days.map((dayIndex) => {
          const tpl = getTemplateForDay(dayIndex);
          const resolvedColor = resolveShiftColor(tpl ? tpl.color : 'slate', theme.mode);
          const hasShift = tpl !== undefined;
          const iconName = tpl !== undefined && isShiftIconName(tpl.icon) ? tpl.icon : 'calendar';

          return (
            <View
              key={`ribbon-day-${dayIndex}`}
              style={[
                styles.cell,
                hasShift && {
                  backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                  borderColor: resolvedColor,
                },
                !hasShift && styles.emptyCell,
              ]}
            >
              <Text variant="caption" tone={hasShift ? 'text' : 'muted'} style={styles.cellDayText}>
                {`D${dayIndex + 1}`}
              </Text>
              {hasShift ? (
                <Icon name={iconName} size={10} tone="text" />
              ) : (
                <View style={styles.emptyDot} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  cell: {
    width: '13%',
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.cellPadding,
    gap: theme.sizes.pillGapCompact,
  },
  emptyCell: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
  },
  emptyDot: {
    width: theme.sizes.dayBadgeDot,
    height: theme.sizes.dayBadgeDot,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
  },
  cellDayText: {
    fontSize: theme.typography.size.micro,
    lineHeight: theme.typography.lineHeight.micro,
    fontWeight: theme.typography.weight.semibold,
  },
}));
