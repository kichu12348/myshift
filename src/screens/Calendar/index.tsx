import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
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
  type WeekStart,
} from '@/domain';
import { Icon, MonthHeader, Text, TextButton } from '@/components';
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
import { makeStyles, useTheme } from '@/theme';
import { formatLongDate, formatWeekRange } from '@/utils';
import { DayDetailSheet } from './components/DayDetailSheet';
import { DayView } from './components/DayView';
import { FloatingStampBar } from './components/FloatingStampBar';
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
 * Features a full-canvas Month view with a modal DayDetailSheet and floating stamp painting.
 */
export function CalendarScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useStyles();

  const today = useToday();
  const settings = useSettingsStore(selectSettings);
  const weekStart: WeekStart = settings?.weekStart ?? DEFAULT_APP_SETTINGS.weekStart;
  const timeFormat = settings?.timeFormat ?? DEFAULT_APP_SETTINGS.timeFormat;

  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [stampTemplateId, setStampTemplateId] = useState<string | null>(null);
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
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.archivedAt === null),
    [templates],
  );
  const activeStampTemplate = useMemo(
    () => (stampTemplateId !== null ? templatesById.get(stampTemplateId) ?? null : null),
    [stampTemplateId, templatesById],
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

  const handleSelectDate = useCallback(
    async (date: LocalDate): Promise<void> => {
      selectDate(date);
      if (activeStampTemplate !== null) {
        const dayShifts = resolvedDays.get(date)?.shifts ?? EMPTY_SHIFTS;
        const existingShift = dayShifts.find((s) => s.templateId === activeStampTemplate.id);
        if (existingShift !== undefined) {
          haptics.selection();
          await useShiftStore.getState().deleteShift(existingShift.id);
        } else {
          haptics.success();
          await useShiftStore.getState().createShift({
            date,
            templateId: activeStampTemplate.id,
            name: activeStampTemplate.name,
            icon: activeStampTemplate.icon,
            color: activeStampTemplate.color,
            isOff: activeStampTemplate.isOff,
            startTime: activeStampTemplate.startTime,
            endTime: activeStampTemplate.endTime,
            breakMinutes: activeStampTemplate.breakMinutes,
            notes: '',
            source: 'manual',
            rotationId: null,
            reminderOverride: activeStampTemplate.reminderOverride,
          });
        }
      } else {
        haptics.selection();
        setIsDaySheetOpen(true);
      }
    },
    [selectDate, activeStampTemplate, resolvedDays],
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
        <View style={styles.monthCanvas}>
          <WeekdayRow weekStart={weekStart} />
          <MonthGrid
            weeks={weeks}
            today={today}
            selectedDate={selectedDate}
            resolvedDays={resolvedDays}
            templatesById={templatesById}
            onSelectDate={(date) => void handleSelectDate(date)}
            onLongPressDate={handleLongPressDate}
          />
          {stampTemplateId !== null ? (
            <FloatingStampBar
              activeTemplateId={stampTemplateId}
              templates={activeTemplates}
              onSelectTemplate={(id) => {
                haptics.selection();
                setStampTemplateId(id);
              }}
              onClose={() => {
                haptics.selection();
                setStampTemplateId(null);
              }}
            />
          ) : activeTemplates.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paint multiple shifts"
              onPress={() => {
                haptics.selection();
                setStampTemplateId(activeTemplates[0]?.id ?? null);
              }}
              style={({ pressed }) => [styles.paintFab, pressed && styles.pressed]}
            >
              <Icon name="edit-3" size={theme.sizes.iconSizeSmall} tone="onAccent" />
              <Text variant="caption" weight="semibold" tone="onAccent">
                Paint
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {viewMode === 'week' ? (
        <WeekView
          selectedDate={selectedDate}
          today={today}
          weekStart={weekStart}
          timeFormat={timeFormat}
          resolvedDays={resolvedDays}
          copiedShift={copiedShift}
          onSelectDate={(date) => void handleSelectDate(date)}
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
        onEnterStampMode={(tplId) => {
          haptics.selection();
          setStampTemplateId(tplId);
        }}
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
  monthCanvas: {
    flex: 1,
    position: 'relative',
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
  paintFab: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
}));
