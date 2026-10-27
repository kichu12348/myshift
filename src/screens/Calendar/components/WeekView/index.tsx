import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { WEEKDAY_SHORT_NAMES } from '@/constants';
import {
  getDayOfWeek,
  getWeekDates,
  isOvernightShift,
  isWeekendDay,
  parseLocalDate,
  type LocalDate,
  type ResolvedDay,
  type ResolvedShift,
  type TimeFormatSetting,
  type WeekStart,
} from '@/domain';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';
import { formatLongDate, formatShiftTimeRange } from '@/utils';

export interface WeekViewProps {
  readonly selectedDate: LocalDate;
  readonly today: LocalDate;
  readonly weekStart: WeekStart;
  readonly timeFormat: TimeFormatSetting;
  readonly resolvedDays: ReadonlyMap<LocalDate, ResolvedDay>;
  readonly copiedShift: ResolvedShift | null;
  readonly onSelectDate: (date: LocalDate) => void;
  readonly onPasteShift: (date: LocalDate) => void;
}

const EMPTY_SHIFTS: ReadonlyArray<ResolvedShift> = [];

/**
 * Week view calendar component displaying the 7 days of the active week
 * as vertical day cards with resolved shift pills and times.
 */
export function WeekView({
  selectedDate,
  today,
  weekStart,
  timeFormat,
  resolvedDays,
  copiedShift,
  onSelectDate,
  onPasteShift,
}: WeekViewProps): ReactElement {
  const styles = useStyles();

  const weekDates = useMemo(() => getWeekDates(selectedDate, weekStart), [selectedDate, weekStart]);

  const handlePressDate = (date: LocalDate): void => {
    haptics.selection();
    onSelectDate(date);
  };

  const handleLongPressDate = (date: LocalDate): void => {
    if (copiedShift !== null) {
      onPasteShift(date);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {weekDates.map((date) => {
        const dow = getDayOfWeek(date);
        const weekday = WEEKDAY_SHORT_NAMES[dow] ?? '';
        const { day } = parseLocalDate(date);
        const isToday = date === today;
        const isSelected = date === selectedDate;
        const isWeekend = isWeekendDay(dow);
        const shifts = resolvedDays.get(date)?.shifts ?? EMPTY_SHIFTS;

        const shiftCountLabel =
          shifts.length === 0
            ? 'No shifts'
            : `${shifts.length} shift${shifts.length === 1 ? '' : 's'}`;
        const accessibilityLabel = `${formatLongDate(date)}, ${shiftCountLabel}`;

        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() => handlePressDate(date)}
            onLongPress={() => handleLongPressDate(date)}
            style={({ pressed }) => [
              styles.dayCard,
              isWeekend ? styles.weekendCard : styles.weekdayCard,
              isSelected ? styles.selectedCard : styles.unselectedCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.dateColumn}>
              <Text variant="caption" tone="muted" weight="semibold">
                {weekday}
              </Text>
              {isToday ? (
                <View style={styles.todayMarker}>
                  <Text variant="caption" weight="semibold" style={styles.todayText}>
                    {day}
                  </Text>
                </View>
              ) : (
                <Text variant="body" weight="semibold" tone="text">
                  {day}
                </Text>
              )}
            </View>

            <View style={styles.shiftsColumn}>
              {shifts.length === 0 ? (
                <Text variant="bodySmall" tone="muted" style={styles.noShiftsText}>
                  No shifts
                </Text>
              ) : (
                shifts.map((shift) => (
                  <View key={shift.id} style={styles.shiftRow}>
                    <View style={styles.pillWrapper}>
                      <ShiftPill
                        name={shift.name}
                        icon={shift.icon}
                        color={shift.color}
                        templateId={shift.templateId}
                        isOff={shift.isOff}
                        isOvernight={isOvernightShift(shift)}
                      />
                    </View>
                    {!shift.isOff ? (
                      <Text variant="caption" tone="muted" tabularNums style={styles.shiftTime}>
                        {formatShiftTimeRange(
                          shift.startsAt,
                          shift.endsAt,
                          shift.isOff,
                          timeFormat,
                        )}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dayCard: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  weekdayCard: {
    backgroundColor: theme.colors.surface,
  },
  weekendCard: {
    backgroundColor: theme.colors.weekendTint,
  },
  selectedCard: {
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
  },
  unselectedCard: {
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  cardPressed: {
    opacity: 0.8,
  },
  dateColumn: {
    width: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  todayMarker: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    color: theme.colors.onAccent,
  },
  shiftsColumn: {
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  pillWrapper: {
    flex: 1,
  },
  shiftTime: {
    flexShrink: 0,
  },
  noShiftsText: {
    paddingVertical: theme.spacing.xs,
  },
}));
