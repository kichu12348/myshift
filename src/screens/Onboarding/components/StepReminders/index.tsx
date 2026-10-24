import { useEffect, useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { formatTimeUntil, normalizeOffsets } from '@/domain';
import { expoPermissionChecker, haptics, type NotificationPermissionStatus } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';

const REMINDER_PRESET_OPTIONS: readonly number[] = [15, 30, 60, 120, 1440];

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

      <View style={styles.cardList}>
        {/* Permission Request Card (if not granted) */}
        {permissionStatus !== 'granted' ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Icon name="bell" size={20} tone="accent" />
              <Text variant="bodySmall" weight="semibold">
                Enable Notifications
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              Grant notification permissions so Myshift can deliver shift reminders to your lock
              screen.
            </Text>
            <Button
              label="Allow Notifications"
              variant="secondary"
              onPress={() => void handleRequestPermission()}
              accessibilityLabel="Allow Notifications"
            />
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
                Receive notifications before upcoming shifts
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
                Reminder Intervals
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

        {/* Quiet disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text variant="caption" tone="muted">
            Shift reminders are scheduled locally. Delivery may be silenced or delayed by device
            battery optimizations, Focus, or Do Not Disturb settings.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Button
            label={isSubmitting ? 'Finishing...' : 'Finish Setup'}
            variant="primary"
            onPress={() => void onFinish()}
            disabled={isSubmitting}
            accessibilityLabel="Finish Setup"
          />
        </View>
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
    borderRadius: theme.radius.md,
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
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
    gap: theme.spacing.xs,
  },
  disclaimerContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  actionContainer: {
    marginTop: theme.spacing.sm,
  },
}));
