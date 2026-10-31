import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { formatTimeUntil, normalizeOffsets } from '@/domain';
import { expoPermissionChecker, haptics, type NotificationPermissionStatus } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';
import { NotificationStackPreview } from '../NotificationStackPreview';

const REMINDER_PRESET_OPTIONS: readonly number[] = [15, 30, 60, 120, 720, 1440];

export interface StepRemindersProps {
  readonly onFinish: () => Promise<void>;
  readonly isSubmitting: boolean;
}

export function StepReminders({ onFinish, isSubmitting }: StepRemindersProps): ReactElement {
  const styles = useStyles();
  const settings = useSettingsStore(selectSettings);

  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');

  useEffect(() => {
    let isMounted = true;
    void expoPermissionChecker.getPermissionStatus().then((status) => {
      if (isMounted) {
        setPermissionStatus(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRequestPermission = async (): Promise<void> => {
    haptics.selection();
    const result = await expoPermissionChecker.requestPermission();
    setPermissionStatus(result);
  };

  const remindersEnabled = settings?.remindersEnabled ?? true;
  const currentOffsets = settings?.defaultMinutesBefore ?? [60, 30, 15];

  const handleToggleReminders = async (enabled: boolean): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({ remindersEnabled: enabled });
  };

  const handleToggleOffset = async (minutes: number): Promise<void> => {
    haptics.selection();
    const isActive = currentOffsets.includes(minutes);
    const updated = isActive
      ? currentOffsets.filter((m) => m !== minutes)
      : normalizeOffsets([...currentOffsets, minutes]);

    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: updated,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          Want a heads-up before your shift starts?
        </Text>
        <Text variant="caption" tone="muted">
          Never miss a shift change. Myshift schedules local reminders before each shift begins.
        </Text>
      </View>

      {/* Visual Notification Cascade Preview */}
      <NotificationStackPreview />

      <View style={styles.cardList}>
        {/* Permission Request Card */}
        {permissionStatus !== 'granted' ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Icon name="bell" size={20} tone="accent" />
              <Text variant="bodySmall" weight="semibold">
                Enable Notifications
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              Grant permissions so Myshift can deliver cascade alerts to your lock screen.
            </Text>
            <Pressable
              style={styles.permissionButton}
              onPress={() => void handleRequestPermission()}
              accessibilityRole="button"
              accessibilityLabel="Allow Notifications"
            >
              <Text variant="caption" weight="semibold" tone="onAccent">
                Allow Notifications
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Master Toggle Card */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelGroup}>
              <Text variant="body" weight="semibold">
                Shift Reminders
              </Text>
              <Text variant="caption" tone="muted">
                Receive cascade notifications before shifts
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={(val) => void handleToggleReminders(val)}
              accessibilityLabel="Enable Shift Reminders"
            />
          </View>
        </View>

        {/* Offsets Selector Card */}
        {remindersEnabled ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="body" weight="semibold">
                Cascade Reminder Intervals
              </Text>
              <Text variant="caption" tone="muted">
                Tap intervals to enable or disable them
              </Text>
            </View>
            <View style={styles.chipRow}>
              {REMINDER_PRESET_OPTIONS.map((minutes) => {
                const isSelected = currentOffsets.includes(minutes);
                return (
                  <Chip
                    key={`reminder-offset-${minutes}`}
                    label={`${formatTimeUntil(minutes)} before`}
                    iconName="bell"
                    selected={isSelected}
                    onPress={() => void handleToggleOffset(minutes)}
                    accessibilityLabel={`${formatTimeUntil(minutes)} before shift. ${isSelected ? 'Active' : 'Inactive'}`}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Bottom CTA Button */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
            isSubmitting && styles.ctaButtonDisabled,
          ]}
          onPress={() => void onFinish()}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Finish Setup"
        >
          <Text variant="body" weight="semibold" tone="onAccent">
            {isSubmitting ? 'Starting...' : 'Start Using myshift'}
          </Text>
          <Icon name="arrow-right" size={18} tone="onAccent" />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  cardList: {
    gap: theme.spacing.md,
  },
  permissionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  permissionButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.touchTarget,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.sizes.touchTarget,
  },
  toggleLabelGroup: {
    flex: 1,
    marginRight: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardHeader: {
    gap: theme.spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  ctaButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
}));
