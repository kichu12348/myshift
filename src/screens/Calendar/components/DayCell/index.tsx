import { memo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { MAX_VISIBLE_SHIFT_PILLS } from '@/constants';
import { isOvernightShift, parseLocalDate, type LocalDate, type ResolvedShift } from '@/domain';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatLongDate } from '@/utils';

export interface DayCellProps {
  readonly date: LocalDate;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isWeekend: boolean;
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly onPress: (date: LocalDate) => void;
  readonly onLongPress?: ((date: LocalDate) => void) | undefined;
}

/**
 * A single calendar day grid cell.
 * Optimized with React.memo and pure primitive/stable props.
 */
export const DayCell = memo(function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  isWeekend,
  shifts,
  onPress,
  onLongPress,
}: DayCellProps): ReactElement {
  const styles = useStyles();
  const { day } = parseLocalDate(date);

  const baseLabel = formatLongDate(date);
  const shiftSummary = shifts.map((s) => s.name).join(', ');
  const accessibilityLabel =
    shifts.length > 0
      ? isToday
        ? `${baseLabel}, Today, ${shiftSummary}`
        : `${baseLabel}, ${shiftSummary}`
      : isToday
        ? `${baseLabel}, Today`
        : baseLabel;

  const visibleShifts = shifts.slice(0, MAX_VISIBLE_SHIFT_PILLS);
  const overflowCount = shifts.length - MAX_VISIBLE_SHIFT_PILLS;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(date)}
      onLongPress={onLongPress ? () => onLongPress(date) : undefined}
      style={[styles.cell, isWeekend ? styles.weekendBackground : styles.weekdayBackground]}
    >
      <View style={styles.header}>
        {isToday ? (
          <View style={styles.todayMarker}>
            <Text variant="bodySmall" weight="semibold" tone="onAccent" tabularNums>
              {String(day)}
            </Text>
          </View>
        ) : (
          <View style={styles.dayNumberContainer}>
            <Text variant="bodySmall" tone={inMonth ? 'text' : 'muted'} tabularNums>
              {String(day)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.pillsSlot}>
        {visibleShifts.map((shift) => (
          <ShiftPill
            key={shift.id}
            name={shift.name}
            icon={shift.icon}
            color={shift.color}
            isOff={shift.isOff}
            isOvernight={isOvernightShift(shift)}
          />
        ))}
        {overflowCount > 0 ? (
          <Text variant="caption" tone="muted" tabularNums style={styles.overflowText}>
            {`+${overflowCount}`}
          </Text>
        ) : null}
      </View>

      {isSelected ? <View style={styles.selectedOutline} pointerEvents="none" /> : null}
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
    gap: theme.spacing.xs,
    overflow: 'hidden',
  },
  overflowText: {
    paddingHorizontal: theme.spacing.xs,
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
