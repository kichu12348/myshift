import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Card, ShiftPill, Text } from '@/components';
import { formatDurationHoursMinutes, type ShiftBreakdownItem } from '@/domain';
import { makeStyles } from '@/theme';

export interface ShiftBreakdownListProps {
  readonly breakdown: ReadonlyArray<ShiftBreakdownItem>;
  readonly monthName: string;
  readonly year: number;
}

function formatCurrency(amount: number): string {
  const parts = amount.toFixed(2).split('.');
  const whole = parts[0] ?? '0';
  const decimal = parts[1] ?? '00';
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}.${decimal}`;
}

/**
 * Breakdown of hours and shifts grouped by template/shift type.
 */
export function ShiftBreakdownList({
  breakdown,
  monthName,
  year,
}: ShiftBreakdownListProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="title" weight="semibold" style={styles.sectionTitle}>
        Shift Breakdown
      </Text>

      {breakdown.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text variant="body" tone="muted" style={styles.emptyText}>
            {`No shifts scheduled in ${monthName} ${year}`}
          </Text>
        </Card>
      ) : (
        <View style={styles.itemsList}>
          {breakdown.map((item) => (
            <Card key={item.key} style={styles.itemCard}>
              <View style={styles.leftColumn}>
                <ShiftPill
                  name={item.name}
                  icon={item.icon}
                  color={item.color}
                  isOff={item.isOff}
                />
                <Text variant="caption" tone="muted" tabularNums>
                  {`${item.shiftCount} ${item.shiftCount === 1 ? 'shift' : 'shifts'}`}
                </Text>
              </View>

              <View style={styles.rightColumn}>
                <Text variant="body" weight="semibold" tabularNums>
                  {formatDurationHoursMinutes(item.totalNetMinutes)}
                </Text>
                {item.estimatedEarnings !== null ? (
                  <Text variant="caption" tone="muted" tabularNums>
                    {formatCurrency(item.estimatedEarnings)}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  itemsList: {
    gap: theme.spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
}));
