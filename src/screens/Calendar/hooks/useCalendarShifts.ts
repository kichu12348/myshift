import { useEffect, useMemo } from 'react';
import {
  getGridDateRange,
  resolveRange,
  type LocalDate,
  type ResolvedDay,
  type ShiftTemplate,
  type WeekStart,
  type YearMonth,
} from '@/domain';
import {
  selectExceptions,
  selectRotations,
  selectShifts,
  selectTemplates,
  useRotationStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';

/**
 * Hook that loads and resolves shifts across the visible 6x7 calendar month grid.
 */
export function useCalendarShifts(
  visibleMonth: YearMonth,
  weekStart: WeekStart,
): ReadonlyMap<LocalDate, ResolvedDay> {
  const { from, to } = useMemo(
    () => getGridDateRange(visibleMonth, weekStart),
    [visibleMonth.year, visibleMonth.month, weekStart],
  );

  useEffect(() => {
    void useShiftStore.getState().loadRange(from, to);
    void useRotationStore.getState().loadExceptions(from, to);
  }, [from, to]);

  const shifts = useShiftStore(selectShifts);
  const rotations = useRotationStore(selectRotations);
  const exceptions = useRotationStore(selectExceptions);
  const templates = useTemplateStore(selectTemplates);

  const templatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    for (const template of templates) {
      map.set(template.id, template);
    }
    return map;
  }, [templates]);

  const resolvedDays = useMemo(() => {
    return resolveRange(from, to, {
      rotations,
      exceptions,
      manualShifts: shifts,
      templatesById,
    });
  }, [from, to, rotations, exceptions, shifts, templatesById]);

  return resolvedDays;
}
