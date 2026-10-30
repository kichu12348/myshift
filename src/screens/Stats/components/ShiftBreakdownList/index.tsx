import { Fragment, useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import { formatDurationHoursMinutes, type ShiftBreakdownItem } from '@/domain';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';

export interface ShiftBreakdownListProps {
  readonly breakdown: ReadonlyArray<ShiftBreakdownItem>;
  readonly monthName: string;
  readonly year: number;
}

/**
 * Breakdown of hours and shifts grouped by template/shift type.
 */
export function ShiftBreakdownList({ breakdown }: ShiftBreakdownListProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const totalNetMinutes = breakdown.reduce((sum, item) => sum + item.totalNetMinutes, 0);

  const totalShifts = breakdown.reduce((sum, item) => sum + item.shiftCount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
          SHIFT BREAKDOWN
        </Text>
      </View>

      {breakdown.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyBadge}>
            <Icon name="bar-chart-2" size={20} tone="accent" />
          </View>
          <Text variant="body" weight="semibold">
            No shifts logged this month
          </Text>
          <Text variant="caption" tone="muted" style={styles.emptySubtitle}>
            Add shifts on the Calendar tab to see your hours and breakdown.
          </Text>
        </View>
      ) : (
        <View style={styles.groupedCard}>
          {breakdown.map((item, index) => {
            const resolvedColor = resolveShiftColor(item.color, theme.mode);
            const rawIcon = item.icon;
            const iconName = isShiftIconName(rawIcon) ? rawIcon : DEFAULT_SHIFT_ICON;

            let percentage = 0;
            if (!item.isOff && totalNetMinutes > 0) {
              percentage = Math.round((item.totalNetMinutes / totalNetMinutes) * 100);
            } else if (totalShifts > 0) {
              percentage = Math.round((item.shiftCount / totalShifts) * 100);
            }

            return (
              <Fragment key={item.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  {/* Top Line of Row */}
                  <View style={styles.rowTopLine}>
                    {/* Left Squircle Icon Badge */}
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                      ]}
                    >
                      <Icon name={iconName} size={20} color={resolvedColor} />
                    </View>

                    {/* Center 2-Line Stack */}
                    <View style={styles.centerStack}>
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="caption" tone="muted" tabularNums>
                        {`${item.shiftCount} ${item.shiftCount === 1 ? 'shift' : 'shifts'}`}
                      </Text>
                    </View>

                    {/* Right Value Stack */}
                    <View style={styles.rightStack}>
                      <Text variant="body" weight="semibold" tabularNums>
                        {formatDurationHoursMinutes(item.totalNetMinutes)}
                      </Text>
                      <Text variant="caption" tone="muted" tabularNums>
                        {`${percentage}%`}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Proportional Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(percentage, 4))}%`,
                          backgroundColor: resolvedColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Fragment>
            );
          })}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  groupedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  row: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  rowTopLine: {
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
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rightStack: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  progressTrack: {
    height: theme.sizes.progressBarHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  emptyBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
}));
