import { NotificationFeedbackType, notificationAsync, selectionAsync } from 'expo-haptics';
import { createLogger } from './logger';

const logger = createLogger('services:haptics');

export interface HapticsService {
  readonly selection: () => void;
  readonly success: () => void;
  readonly warning: () => void;
}

let isEnabled = true;

/**
 * Configure whether haptics are enabled globally based on user settings.
 */
export function setHapticsEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return isEnabled;
}

/**
 * Haptics feedback service wrapping expo-haptics.
 * Never throws; logs non-fatal errors at debug level.
 * Safe to call on all platforms.
 */
export const haptics: HapticsService = {
  selection(): void {
    if (!isHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await selectionAsync();
      } catch (err: unknown) {
        logger.debug('Haptics selection feedback failed', err);
      }
    })();
  },

  success(): void {
    if (!isHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await notificationAsync(NotificationFeedbackType.Success);
      } catch (err: unknown) {
        logger.debug('Haptics success notification failed', err);
      }
    })();
  },

  warning(): void {
    if (!isHapticsEnabled()) return;

    void (async (): Promise<void> => {
      try {
        await notificationAsync(NotificationFeedbackType.Warning);
      } catch (err: unknown) {
        logger.debug('Haptics warning notification failed', err);
      }
    })();
  },
};
