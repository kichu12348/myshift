import { memo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { MAX_VISIBLE_SHIFT_PILLS } from '@/constants';
import {
  isOvernightShift,
  parseLocalDate,
  type LocalDate,
  type ResolvedShift,
  type ShiftTemplate,
} from '@/domain';
import { Icon } from '@/components/Icon';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatLongDate } from '@/utils';

export interface DayCellProps {
  readonly date: LocalDate;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isWeekend: boolean;
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly templatesById?: ReadonlyMap<string, ShiftTemplate> | undefined;
  readonly onPress: (date: LocalDate) => void;
  readonly onLongPress?: ((date: LocalDate) => void) | undefined;
}

/**
 * A single calendar day grid cell rendered as an individual rounded tile.
 * Optimized with React.memo and dynamic template color resolution.
 */
export const DayCell = memo(function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  shifts,
  templatesById,
  onPress,
  onLongPress,
}: DayCellProps): ReactElement {
  const { theme } = useTheme();
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

  const shiftWithReminder = shifts.find(
    (s) =>
      ('customMinutesBefore' in s && s.customMinutesBefore !== null) ||
      s.reminderOverride !== null,
  );
  const shiftWithNotes = shifts.find(
    (s) => s.notes !== undefined && s.notes !== null && s.notes.trim().length > 0,
  );

  const reminderTemplate =
    shiftWithReminder !== undefined && shiftWithReminder.templateId !== null
      ? templatesById?.get(shiftWithReminder.templateId)
      : undefined;
  const reminderColor =
    shiftWithReminder !== undefined
      ? resolveShiftColor(reminderTemplate?.color ?? shiftWithReminder.color, theme.mode)
      : undefined;

  const notesTemplate =
    shiftWithNotes !== undefined && shiftWithNotes.templateId !== null
      ? templatesById?.get(shiftWithNotes.templateId)
      : undefined;
  const notesColor =
    shiftWithNotes !== undefined
      ? resolveShiftColor(notesTemplate?.color ?? shiftWithNotes.color, theme.mode)
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(date)}
      onLongPress={onLongPress ? () => onLongPress(date) : undefined}
      style={[
        styles.cell,
        !inMonth && styles.cellOutOfMonth,
        isSelected && styles.cellSelected,
      ]}
    >
      <View style={styles.header}>
        {isToday ? (
          <View style={styles.todayCircle}>
            <Text variant="caption" weight="semibold" tone="onAccent" tabularNums>
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
        <View style={styles.indicatorContainer}>
          {reminderColor !== undefined ? (
            <Icon name="bell" size={12} color={reminderColor} />
          ) : null}
          {notesColor !== undefined ? (
            <View style={[styles.notesBadgeDot, { backgroundColor: notesColor }]} />
          ) : null}
        </View>
      </View>

      <View style={styles.pillsSlot}>
        {visibleShifts.map((shift) => {
          const template =
            shift.templateId !== null ? templatesById?.get(shift.templateId) : undefined;
          const shiftColor = resolveShiftColor(template?.color ?? shift.color, theme.mode);

          return (
            <ShiftPill
              key={shift.id}
              name={shift.name}
              icon={shift.icon}
              color={shiftColor}
              templateId={shift.templateId}
              isOff={shift.isOff}
              isOvernight={isOvernightShift(shift)}
              variant="compact"
            />
          );
        })}
        {overflowCount > 0 ? (
          <View style={styles.overflowPill}>
            <Text variant="micro" tone="muted" tabularNums>
              {`+${overflowCount}`}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const useStyles = makeStyles((theme) => ({
  cell: {
    flex: 1,
    height: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    margin: theme.sizes.gridGap / 2,
    padding: theme.spacing.xs,
    borderWidth: theme.sizes.selectedBorder,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: theme.colors.accent,
  },
  cellOutOfMonth: {
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  dayNumberContainer: {
    minWidth: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    width: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorContainer: {
    width: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  notesBadgeDot: {
    width: theme.sizes.dayBadgeDot,
    height: theme.sizes.dayBadgeDot,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
  },
  pillsSlot: {
    flex: 1,
    gap: theme.spacing.xs,
    overflow: 'hidden',
  },
  overflowPill: {
    height: theme.sizes.compactPillHeight,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
}));
