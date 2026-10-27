import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MONTH_NAMES } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import {
  DEFAULT_APP_SETTINGS,
  computeMonthlyStats,
  formatDurationHoursMinutes,
  getMonthGrid,
  getWeekDates,
  getWeekDateRange,
  getYearMonth,
  parseLocalDate,
  type LocalDate,
  type ResolvedShift,
  type ShiftTemplate,
  type WeekStart,
} from '@/domain';
import { MonthHeader, Text, TextButton } from '@/components';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { haptics } from '@/services';
import {
  selectSettings,
  selectTemplates,
  useSettingsStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';
import { makeStyles } from '@/theme';
import { formatLongDate, formatWeekRange } from '@/utils';
import { DayDetailSheet } from './components/DayDetailSheet';
import { DayView } from './components/DayView';
import { MonthGrid } from './components/MonthGrid';
import { ViewModeToggle } from './components/ViewModeToggle';
import { WeekView } from './components/WeekView';
import { WeekdayRow } from './components/WeekdayRow';
import { useCalendarMonth } from './hooks/useCalendarMonth';
import { useCalendarShifts } from './hooks/useCalendarShifts';
import { useShiftClipboard } from './hooks/useShiftClipboard';

const EMPTY_SHIFTS: ReadonlyArray<ResolvedShift> = [];

/**
 * Calendar screen displaying Month, Week, or Day calendar views with header navigation.
 */
export function CalendarScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const today = useToday();
  const settings = useSettingsStore(selectSettings);
  const weekStart: WeekStart = settings?.weekStart ?? DEFAULT_APP_SETTINGS.weekStart;
  const timeFormat = settings?.timeFormat ?? DEFAULT_APP_SETTINGS.timeFormat;

  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [paintingTemplate, setPaintingTemplate] = useState<ShiftTemplate | null>(null);
  const { copiedShift, copyShift, clearClipboard, pasteShift } = useShiftClipboard();

  const state = useCalendarMonth(today);
  const {
    viewMode,
    visibleMonth,
    selectedDate,
    setViewMode,
    selectDate,
    goToDate,
    goToPrevious,
    goToNext,
  } = state;

  const resolvedDays = useCalendarShifts(visibleMonth, weekStart);

  const templates = useTemplateStore(selectTemplates);
  const templatesById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates],
  );

  const monthStats = useMemo(() => {
    const monthShifts: ResolvedShift[] = [];
    for (const [date, resolvedDay] of resolvedDays) {
      const parsed = parseLocalDate(date);
      if (parsed.year === visibleMonth.year && parsed.month === visibleMonth.month) {
        for (const s of resolvedDay.shifts) {
          monthShifts.push(s);
        }
      }
    }
    const summary = computeMonthlyStats(monthShifts, templatesById);
    const formattedHours = formatDurationHoursMinutes(summary.totalNetMinutes);
    return {
      workingShiftCount: summary.workingShiftCount,
      formattedHours,
      subtitle: `${summary.workingShiftCount} shifts \u00b7 ${formattedHours}`,
    };
  }, [resolvedDays, visibleMonth, templatesById]);

  const selectedDayShifts = useMemo(() => {
    return resolvedDays.get(selectedDate)?.shifts ?? EMPTY_SHIFTS;
  }, [resolvedDays, selectedDate]);

  const weeks = useMemo(() => getMonthGrid(visibleMonth, weekStart), [visibleMonth, weekStart]);

  const title = useMemo(() => {
    if (viewMode === 'month') {
      const monthIndex = visibleMonth.month - 1;
      const monthName = MONTH_NAMES[monthIndex] ?? '';
      return `${monthName} ${visibleMonth.year}`;
    }
    if (viewMode === 'week') {
      const weekRange = getWeekDateRange(selectedDate, weekStart);
      return formatWeekRange(weekRange.from, weekRange.to);
    }
    return formatLongDate(selectedDate);
  }, [viewMode, visibleMonth, selectedDate, weekStart]);

  const showTodayButton = useMemo(() => {
    if (viewMode === 'month') {
      const todayYearMonth = getYearMonth(today);
      return (
        visibleMonth.year !== todayYearMonth.year || visibleMonth.month !== todayYearMonth.month
      );
    }
    if (viewMode === 'week') {
      return !getWeekDates(selectedDate, weekStart).includes(today);
    }
    return selectedDate !== today;
  }, [viewMode, visibleMonth, selectedDate, today, weekStart]);

  const handleTogglePaintMode = useCallback((template: ShiftTemplate): void => {
    setPaintingTemplate((current) => (current?.id === template.id ? null : template));
    haptics.selection();
  }, []);

  const handleClearPaintMode = useCallback((): void => {
    setPaintingTemplate(null);
    haptics.selection();
  }, []);

  const handleSelectDate = useCallback(
    (date: LocalDate): void => {
      haptics.selection();
      selectDate(date);
      if (paintingTemplate !== null) {
        haptics.success();
        void useShiftStore.getState().createShift({
          date,
          templateId: paintingTemplate.id,
          name: paintingTemplate.name,
          icon: paintingTemplate.icon,
          color: paintingTemplate.color,
          isOff: paintingTemplate.isOff,
          startTime: paintingTemplate.startTime,
          endTime: paintingTemplate.endTime,
          breakMinutes: paintingTemplate.breakMinutes,
          notes: '',
          source: 'manual',
          rotationId: null,
          reminderOverride: paintingTemplate.reminderOverride,
        });
      } else {
        setIsDaySheetOpen(true);
      }
    },
    [selectDate, paintingTemplate],
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

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleEditShift = useCallback(
    (shift: ResolvedShift): void => {
      setIsDaySheetOpen(false);
      navigation.navigate(ROOT_ROUTES.SHIFT_EDITOR, { date: shift.date, shift });
    },
    [navigation],
  );

  const handleCustomShift = useCallback((): void => {
    setIsDaySheetOpen(false);
    navigation.navigate(ROOT_ROUTES.SHIFT_EDITOR, { date: selectedDate });
  }, [navigation, selectedDate]);

  const handleOpenTemplates = useCallback((): void => {
    setIsDaySheetOpen(false);
    navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
  }, [navigation]);

  const handleOpenRotations = useCallback((): void => {
    setIsDaySheetOpen(false);
    navigation.navigate(ROOT_ROUTES.ROTATION_WIZARD);
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MonthHeader
        title={title}
        subtitle={viewMode === 'month' ? monthStats.subtitle : undefined}
        showTodayButton={showTodayButton}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={handleToday}
        onRotations={handleOpenRotations}
        previousLabel={
          viewMode === 'month'
            ? 'Previous month'
            : viewMode === 'week'
              ? 'Previous week'
              : 'Previous day'
        }
        nextLabel={
          viewMode === 'month' ? 'Next month' : viewMode === 'week' ? 'Next week' : 'Next day'
        }
      />
      <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      {copiedShift !== null ? (
        <View style={styles.clipboardBanner}>
          <Text variant="caption" tone="text" numberOfLines={1} style={styles.clipboardText}>
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
      {viewMode === 'month' ? (
        <>
          <WeekdayRow weekStart={weekStart} />
          <MonthGrid
            weeks={weeks}
            today={today}
            selectedDate={selectedDate}
            resolvedDays={resolvedDays}
            templatesById={templatesById}
            onSelectDate={handleSelectDate}
            onLongPressDate={handleLongPressDate}
          />
        </>
      ) : null}
      {viewMode === 'week' ? (
        <WeekView
          selectedDate={selectedDate}
          today={today}
          weekStart={weekStart}
          timeFormat={timeFormat}
          resolvedDays={resolvedDays}
          copiedShift={copiedShift}
          onSelectDate={handleSelectDate}
          onPasteShift={handlePasteInSheet}
        />
      ) : null}
      {viewMode === 'day' ? (
        <DayView
          selectedDate={selectedDate}
          today={today}
          weekStart={weekStart}
          timeFormat={timeFormat}
          shifts={selectedDayShifts}
          onSelectDate={selectDate}
          onEditShift={handleEditShift}
          onCustomShift={handleCustomShift}
        />
      ) : null}
      <DayDetailSheet
        visible={isDaySheetOpen}
        date={selectedDate}
        shifts={selectedDayShifts}
        copiedShift={copiedShift}
        timeFormat={timeFormat}
        paintingTemplate={paintingTemplate}
        onTogglePaintMode={handleTogglePaintMode}
        onClearPaintMode={handleClearPaintMode}
        onClose={() => setIsDaySheetOpen(false)}
        onCopyShift={copyShift}
        onPasteShift={handlePasteInSheet}
        onEditShift={handleEditShift}
        onCustomShift={handleCustomShift}
        onOpenTemplates={handleOpenTemplates}
        onOpenRotations={handleOpenRotations}
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
