import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { toLocalDate, type LocalDate } from '@/domain';

function getTodayLocalDate(): LocalDate {
  return toLocalDate(new Date());
}

/**
 * Hook that returns today's local date (YYYY-MM-DD) and keeps it accurate while the app remains open.
 *
 * Schedules a local midnight timer so that night-shift nurses keeping the app open overnight
 * see the date automatically transition at midnight. Also updates when the app returns from background.
 *
 * Note: This timer only refreshes the UI and is never used for reminders.
 */
export function useToday(): LocalDate {
  const [today, setToday] = useState<LocalDate>(getTodayLocalDate);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function scheduleMidnightUpdate(): void {
      if (timerId !== null) {
        clearTimeout(timerId);
      }

      const now = new Date();
      // Target next local midnight + 100ms to guarantee date rollover
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        100,
      );
      const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime());

      timerId = setTimeout(() => {
        if (!isMounted) {
          return;
        }
        setToday(getTodayLocalDate());
        scheduleMidnightUpdate();
      }, delayMs);
    }

    scheduleMidnightUpdate();

    function handleAppStateChange(nextStatus: AppStateStatus): void {
      if (nextStatus === 'active' && isMounted) {
        setToday(getTodayLocalDate());
        scheduleMidnightUpdate();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      subscription.remove();
    };
  }, []);

  return today;
}
