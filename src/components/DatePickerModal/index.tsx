import { useEffect, useState, type ReactElement } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { MONTH_NAMES, WEEKDAY_SHORT_NAMES } from '@/constants/calendar';
import {
  addMonths,
  compareLocalDates,
  getMonthGrid,
  getWeekdayOrder,
  getYearMonth,
  parseLocalDate,
  type CalendarDay,
  type LocalDate,
  type YearMonth,
} from '@/domain';
import { useToday } from '@/hooks';
import { haptics } from '@/services';
import { useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';

export interface DatePickerModalProps {
  readonly visible: boolean;
  readonly title?: string | undefined;
  readonly selectedDate: LocalDate | null;
  readonly onConfirm: (date: LocalDate) => void;
  readonly onClose: () => void;
  readonly allowClear?: boolean | undefined;
  readonly onClear?: (() => void) | undefined;
  readonly minDate?: LocalDate | undefined;
}

export function DatePickerModal({
  visible,
  title,
  selectedDate,
  onConfirm,
  onClose,
  allowClear = false,
  onClear,
  minDate,
}: DatePickerModalProps): ReactElement {
  const styles = useStyles();
  const today = useToday();
  const weekStart = useSettingsStore((s) => s.settings?.weekStart ?? 0);

  const [draftDate, setDraftDate] = useState<LocalDate | null>(selectedDate);
  const [yearMonth, setYearMonth] = useState<YearMonth>(() => getYearMonth(selectedDate ?? today));

  useEffect(() => {
    if (visible) {
      setDraftDate(selectedDate);
      setYearMonth(getYearMonth(selectedDate ?? today));
    }
  }, [visible, selectedDate, today]);

  const monthName = MONTH_NAMES[yearMonth.month - 1] ?? '';
  const weekdayOrder = getWeekdayOrder(weekStart);
  const grid = getMonthGrid(yearMonth, weekStart);

  const handleDone = (): void => {
    if (draftDate !== null) {
      haptics.success();
      onConfirm(draftDate);
      onClose();
    }
  };

  const handleClear = (): void => {
    haptics.warning();
    onClear?.();
    onClose();
  };

  const renderCell = (day: CalendarDay): ReactElement => {
    if (!day.inMonth) {
      return (
        <View key={day.date} style={[styles.dayCellWrapper, { backgroundColor: 'transparent' }]} />
      );
    }
    const isBeforeMin = minDate !== undefined && compareLocalDates(day.date, minDate) < 0;
    const isSelected = draftDate === day.date;
    const isToday = day.date === today;
    const dayNumber = parseLocalDate(day.date).day;

    return (
      <View
        key={day.date}
        style={[
          styles.dayCellWrapper,
          isSelected && styles.dayCellSelected,
          isBeforeMin && styles.dayCellDisabled,
        ]}
      >
        <Pressable
          style={styles.dayButton}
          disabled={isBeforeMin}
          onPress={() => {
            haptics.selection();
            setDraftDate(day.date);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Select date ${day.date}`}
          accessibilityState={{ selected: isSelected, disabled: isBeforeMin }}
        >
          <Text
            variant="bodySmall"
            weight={isSelected || isToday ? 'semibold' : 'regular'}
            tone={isSelected ? 'onAccent' : isBeforeMin ? 'muted' : isToday ? 'accent' : 'text'}
            tabularNums
          >
            {String(dayNumber)}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
          {title !== undefined ? (
            <Text variant="bodySmall" weight="semibold" tone="muted" style={styles.headerLabel}>
              {title}
            </Text>
          ) : null}

          <View style={styles.monthHeaderRow}>
            <Text variant="title" weight="semibold">{`${monthName} ${yearMonth.year}`}</Text>
            <View style={styles.monthNav}>
              <IconButton
                iconName="chevron-left"
                accessibilityLabel="Previous month"
                onPress={() => {
                  haptics.selection();
                  setYearMonth((prev) => addMonths(prev, -1));
                }}
              />
              <IconButton
                iconName="chevron-right"
                accessibilityLabel="Next month"
                onPress={() => {
                  haptics.selection();
                  setYearMonth((prev) => addMonths(prev, 1));
                }}
              />
            </View>
          </View>

          <View style={styles.weekdaysRow}>
            {weekdayOrder.map((d) => (
              <View
                key={`wd-${d}`}
                style={[
                  styles.dayCellWrapper,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                <Text variant="caption" tone="muted" weight="semibold">
                  {WEEKDAY_SHORT_NAMES[d]}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((week, idx) => (
              <View key={`wk-${idx}`} style={styles.weekRow}>
                {week.map(renderCell)}
              </View>
            ))}
          </View>

          <View style={styles.footerRow}>
            <Pressable
              style={styles.actionButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel date picker"
            >
              <Text variant="body" weight="semibold" tone="muted">
                Cancel
              </Text>
            </Pressable>
            {allowClear ? (
              <Pressable
                style={styles.actionButton}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Set to ongoing"
              >
                <Text variant="body" weight="semibold" tone="accent">
                  Ongoing
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.doneButton, draftDate === null && styles.doneButtonDisabled]}
              disabled={draftDate === null}
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="Confirm date selection"
            >
              <Text variant="body" weight="semibold" tone="onAccent">
                Done
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  dialogCard: {
    width: '100%',
    maxWidth: theme.sizes.calendarModalMaxWidth,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  headerLabel: {
    textAlign: 'center',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grid: {
    gap: theme.spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCellWrapper: {
    width: theme.sizes.calendarModalCellSize,
    height: theme.sizes.calendarModalCellSize,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
  },
  dayButton: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.accent,
  },
  dayCellDisabled: {
    opacity: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
}));
