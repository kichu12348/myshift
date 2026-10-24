import { useEffect } from 'react';
import { AppState } from 'react-native';
import { requestReminderSync } from '@/services';

/**
 * Hook to trigger reminder reconciliation on mount and whenever the app transitions to active foreground.
 */
export function useReminderSync(): void {
  useEffect(() => {
    void requestReminderSync();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void requestReminderSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
