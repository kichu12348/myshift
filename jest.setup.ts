/**
 * Jest global setup and strictly typed native module mocks.
 * Per AGENTS.md Section 5.
 */

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  AndroidImportance: {
    HIGH: 4,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
    withTransactionSync: jest.fn(),
  }),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));
