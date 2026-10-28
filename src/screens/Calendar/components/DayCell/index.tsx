import { memo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { MAX_VISIBLE_SHIFT_PILLS } from '@/constants';
import {
  isOvernightShift,
  parseLocalDate,
  type LocalDate,
  type ResolvedShift,
  type ShiftTemplate,
  type TimeFormatSetting,
} from '@/domain';
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
  readonly timeFormat?: TimeFormatSetting | undefined;
  readonly onPress: (date: LocalDate) => void;
  readonly onLongPress?: ((date: LocalDate) => void) | undefined;
}

/**
 * A single calendar day grid cell rendered with full-width borderless columns.
 * Optimized with React.memo and dynamic template color resolution.
 */
export const DayCell = memo(function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  isWeekend,
  shifts,
  templatesById,
  timeFormat,
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(date)}
      onLongPress={onLongPress ? () => onLongPress(date) : undefined}
      style={[
        styles.cell,
        isWeekend && styles.cellWeekend,
        !inMonth && styles.cellOutOfMonth,
        isSelected && styles.cellSelected,
      ]}
    >
      {isToday ? (
        <View style={styles.todayCircle}>
          <Text variant="caption" weight="semibold" tone="onAccent" tabularNums>
            {String(day)}
          </Text>
        </View>
      ) : (
        <View style={styles.dayNumberContainer}>
          <Text
            variant="bodySmall"
            weight="semibold"
            tone={inMonth ? 'text' : 'muted'}
            tabularNums
          >
            {String(day)}
          </Text>
        </View>
      )}

      <View style={styles.pillsSlot}>
        {visibleShifts.map((shift) => {
          const template =
            shift.templateId !== null ? templatesById?.get(shift.templateId) : undefined;
          const shiftColor = resolveShiftColor(template?.color ?? shift.color, theme.mode);

          return (
            <ShiftPill
              key={shift.id}
              shift={shift}
              name={shift.name}
              icon={shift.icon}
              color={shiftColor}
              templateId={shift.templateId}
              isOff={shift.isOff}
              isOvernight={isOvernightShift(shift)}
              timeFormat={timeFormat}
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
    paddingHorizontal: theme.sizes.shiftBlockGap,
    paddingTop: theme.spacing.xs,
    justifyContent: 'flex-start',
  },
  cellWeekend: {
    backgroundColor: theme.colors.weekendTint,
  },
  cellOutOfMonth: {
    opacity: 0.35,
  },
  cellSelected: {
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accentSoft,
  },
  dayNumberContainer: {
    width: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.xs,
  },
  todayCircle: {
    width: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.xs,
  },
  pillsSlot: {
    flex: 1,
    gap: theme.sizes.shiftBlockMarginBottom,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  overflowPill: {
    height: theme.sizes.compactPillHeight,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.sizes.pillPaddingCompact,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
}));
