import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MONTH_NAMES } from '@/constants';
import {
  DEFAULT_APP_SETTINGS,
  getMonthGrid,
  getYearMonth,
  type LocalDate,
  type ResolvedShift,
  type WeekStart,
} from '@/domain';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { useToday } from '@/hooks';
import { haptics } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';
import { DayDetailSheet } from './components/DayDetailSheet';
import { MonthGrid } from './components/MonthGrid';
import { MonthHeader } from './components/MonthHeader';
import { WeekdayRow } from './components/WeekdayRow';
import { useCalendarMonth } from './hooks/useCalendarMonth';
import { useCalendarShifts } from './hooks/useCalendarShifts';
import { useShiftClipboard } from './hooks/useShiftClipboard';

const EMPTY_SHIFTS: ReadonlyArray<ResolvedShift> = [];

/**
 * Calendar screen displaying a full month grid, header navigation, and weekday column labels.
 */
export function CalendarScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const today = useToday();
  const settings = useSettingsStore(selectSettings);
  const weekStart: WeekStart = settings?.weekStart ?? DEFAULT_APP_SETTINGS.weekStart;
  const timeFormat = settings?.timeFormat ?? DEFAULT_APP_SETTINGS.timeFormat;

  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const { copiedShift, copyShift, clearClipboard, pasteShift } = useShiftClipboard();

  const state = useCalendarMonth(today);
  const { visibleMonth, selectedDate, selectDate, goToDate, goToPreviousMonth, goToNextMonth } =
    state;

  const resolvedDays = useCalendarShifts(visibleMonth, weekStart);

  const selectedDayShifts = useMemo(() => {
    return resolvedDays.get(selectedDate)?.shifts ?? EMPTY_SHIFTS;
  }, [resolvedDays, selectedDate]);

  const weeks = useMemo(
    () => getMonthGrid(visibleMonth, weekStart),
    [visibleMonth, weekStart],
  );

  const monthIndex = visibleMonth.month - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? '';
  const title = `${monthName} ${visibleMonth.year}`;

  const todayYearMonth = getYearMonth(today);
  const showTodayButton =
    visibleMonth.year !== todayYearMonth.year ||
    visibleMonth.month !== todayYearMonth.month;

  const handleSelectDate = useCallback(
    (date: LocalDate): void => {
      haptics.selection();
      selectDate(date);
      setIsDaySheetOpen(true);
    },
    [selectDate],
  );

  const handleLongPressDate = useCallback(
    (date: LocalDate): void => {
      if (copiedShift !== null) {
        void pasteShift(date);
      }
    },
    [copiedShift, pasteShift],
  );

  const handleToday = useCallback((): void => {
    goToDate(today);
  }, [goToDate, today]);

  const handlePasteInSheet = useCallback(
    (date: LocalDate): void => {
      void pasteShift(date);
    },
    [pasteShift],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MonthHeader
        title={title}
        showTodayButton={showTodayButton}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={handleToday}
      />
      <WeekdayRow weekStart={weekStart} />
      {copiedShift !== null ? (
        <View style={styles.clipboardBanner}>
          <Text
            variant="caption"
            tone="text"
            numberOfLines={1}
            style={styles.clipboardText}
          >
            {`Copied ${copiedShift.name} \u2014 long-press any day to paste`}
          </Text>
          <TextButton
            label="Clear"
            tone="muted"
            onPress={clearClipboard}
            accessibilityLabel="Clear copied shift"
          />
        </View>
      ) : null}
      <MonthGrid
        weeks={weeks}
        today={today}
        selectedDate={selectedDate}
        resolvedDays={resolvedDays}
        onSelectDate={handleSelectDate}
        onLongPressDate={handleLongPressDate}
      />
      <DayDetailSheet
        visible={isDaySheetOpen}
        date={selectedDate}
        shifts={selectedDayShifts}
        copiedShift={copiedShift}
        timeFormat={timeFormat}
        onClose={() => setIsDaySheetOpen(false)}
        onCopyShift={copyShift}
        onPasteShift={handlePasteInSheet}
      />
    </View>
  );
}

export default CalendarScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  clipboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  clipboardText: {
    flex: 1,
  },
}));
