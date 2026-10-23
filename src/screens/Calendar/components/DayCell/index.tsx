import { memo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { parseLocalDate, type LocalDate } from '@/domain';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatLongDate } from '@/utils';

export interface DayCellProps {
  readonly date: LocalDate;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isWeekend: boolean;
  readonly onPress: (date: LocalDate) => void;
}

/**
 * A single calendar day grid cell.
 * Optimized with React.memo and pure primitive props.
 */
export const DayCell = memo(function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  isWeekend,
  onPress,
}: DayCellProps): ReactElement {
  const styles = useStyles();
  const { day } = parseLocalDate(date);

  const baseLabel = formatLongDate(date);
  const accessibilityLabel = isToday ? `${baseLabel}, Today` : baseLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(date)}
      style={[
        styles.cell,
        isWeekend ? styles.weekendBackground : styles.weekdayBackground,
      ]}
    >
      <View style={styles.header}>
        {isToday ? (
          <View style={styles.todayMarker}>
            <Text
              variant="bodySmall"
              weight="semibold"
              tone="onAccent"
              tabularNums
            >
              {String(day)}
            </Text>
          </View>
        ) : (
          <View style={styles.dayNumberContainer}>
            <Text
              variant="bodySmall"
              tone={inMonth ? 'text' : 'muted'}
              tabularNums
            >
              {String(day)}
            </Text>
          </View>
        )}
      </View>

      {/* Lower part of the cell is flexible and reserved for shift pills (Batch 12) */}
      <View style={styles.pillsSlot} />

      {isSelected ? (
        <View style={styles.selectedOutline} pointerEvents="none" />
      ) : null}
    </Pressable>
  );
});

const useStyles = makeStyles((theme) => ({
  cell: {
    flex: 1,
    height: '100%',
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
  },
  weekendBackground: {
    backgroundColor: theme.colors.weekendTint,
  },
  weekdayBackground: {
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'flex-start',
  },
  dayNumberContainer: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMarker: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsSlot: {
    flex: 1,
  },
  selectedOutline: {
    position: 'absolute',
    top: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
    bottom: theme.spacing.xs,
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
  },
}));
