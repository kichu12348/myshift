import { useCallback, useState } from 'react';
import {
  epochToTimeOfDay,
  type LocalDate,
  type ResolvedShift,
} from '@/domain';
import { haptics } from '@/services';
import { useShiftStore } from '@/store';

export interface ShiftClipboardState {
  readonly copiedShift: ResolvedShift | null;
  readonly copyShift: (shift: ResolvedShift) => void;
  readonly clearClipboard: () => void;
  readonly pasteShift: (targetDate: LocalDate) => Promise<void>;
}

/**
 * Hook to manage shift clipboard state for copy and paste interactions.
 */
export function useShiftClipboard(): ShiftClipboardState {
  const [copiedShift, setCopiedShift] = useState<ResolvedShift | null>(null);

  const copyShift = useCallback((shift: ResolvedShift): void => {
    haptics.selection();
    setCopiedShift(shift);
  }, []);

  const clearClipboard = useCallback((): void => {
    setCopiedShift(null);
  }, []);

  const pasteShift = useCallback(
    async (targetDate: LocalDate): Promise<void> => {
      if (copiedShift === null) {
        return;
      }

      haptics.success();
      await useShiftStore.getState().createShift({
        date: targetDate,
        templateId: copiedShift.templateId,
        name: copiedShift.name,
        icon: copiedShift.icon,
        color: copiedShift.color,
        isOff: copiedShift.isOff,
        startTime: copiedShift.isOff
          ? '00:00'
          : epochToTimeOfDay(copiedShift.startsAt),
        endTime: copiedShift.isOff
          ? '00:00'
          : epochToTimeOfDay(copiedShift.endsAt),
        breakMinutes: copiedShift.breakMinutes,
        notes: copiedShift.notes,
        source: 'manual',
        rotationId: null,
        reminderOverride: copiedShift.reminderOverride,
      });
    },
    [copiedShift],
  );

  return {
    copiedShift,
    copyShift,
    clearClipboard,
    pasteShift,
  };
}
