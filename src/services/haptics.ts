import { NotificationFeedbackType, notificationAsync, selectionAsync } from 'expo-haptics';
import { createLogger } from './logger';
import { useSettingsStore } from '@/store';

const logger = createLogger('services:haptics');

export interface HapticsService {
  readonly selection: () => void;
  readonly success: () => void;
  readonly warning: () => void;
}

const getHapticsEnabled = () => useSettingsStore.getState().settings?.hapticsEnabled ?? true;

/**
 * Haptics feedback service wrapping expo-haptics.
 * Never throws; logs non-fatal errors at debug level.
 * Safe to call on all platforms.
 */
export const haptics: HapticsService = {
  selection(): void {
    if (!getHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await selectionAsync();
      } catch (err: unknown) {
        logger.debug('Haptics selection feedback failed', err);
      }
    })();
  },

  success(): void {
    if (!getHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await notificationAsync(NotificationFeedbackType.Success);
      } catch (err: unknown) {
        logger.debug('Haptics success notification failed', err);
      }
    })();
  },

  warning(): void {
    if (!getHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await notificationAsync(NotificationFeedbackType.Warning);
      } catch (err: unknown) {
        logger.debug('Haptics warning notification failed', err);
      }
    })();
  },
};
