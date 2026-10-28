import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { buildReminderMessage } from '@/domain';
import { createLogger } from './logger';

const logger = createLogger('services:notifications');

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'shift-reminders';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionChecker {
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<NotificationPermissionStatus>;
}

export interface ReminderNotificationPayload {
  readonly shiftKey: string;
  readonly shiftName: string;
  readonly offsetMinutes: number;
  readonly fireAt: number;
}

export interface NotificationScheduler {
  ensureChannel(): Promise<void>;
  getScheduledIds(): Promise<ReadonlySet<string>>;
  scheduleReminder(payload: ReminderNotificationPayload): Promise<string>;
  cancelNotification(notificationId: string): Promise<void>;
}

// Configure foreground notifications
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

export const expoPermissionChecker: PermissionChecker = {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const res = await Notifications.getPermissionsAsync();
      if (res.granted) {
        return 'granted';
      }
      if (res.status === Notifications.PermissionStatus.DENIED) {
        return 'denied';
      }
      return 'undetermined';
    } catch (err: unknown) {
      logger.error('Failed to get notification permissions', err);
      return 'undetermined';
    }
  },

  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      const res = await Notifications.requestPermissionsAsync();
      if (res.granted) {
        return 'granted';
      }
      if (res.status === Notifications.PermissionStatus.DENIED) {
        return 'denied';
      }
      return 'undetermined';
    } catch (err: unknown) {
      logger.error('Failed to request notification permissions', err);
      return 'undetermined';
    }
  },
};

export const expoNotificationScheduler: NotificationScheduler = {
  async ensureChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
          name: 'Shift Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      } catch (err: unknown) {
        logger.error('Failed to create Android notification channel', err);
      }
    }
  },

  async getScheduledIds(): Promise<ReadonlySet<string>> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return new Set(scheduled.map((req) => req.identifier));
    } catch (err: unknown) {
      logger.error('Failed to get scheduled notification IDs', err);
      return new Set();
    }
  },

  async scheduleReminder(payload: ReminderNotificationPayload): Promise<string> {
    await this.ensureChannel();

    const { title, body } = buildReminderMessage(payload.shiftName, payload.offsetMinutes);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          shiftId: payload.shiftKey,
          minutesBefore: payload.offsetMinutes,
        },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: payload.fireAt,
        channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      },
    });

    return notificationId;
  },

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err: unknown) {
      logger.warn(`Failed to cancel notification ${notificationId}`, err);
    }
  },
};
