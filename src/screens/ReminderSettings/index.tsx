import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import {
  formatTimeUntil,
  isValidOffset,
  MAX_REMINDER_OFFSET_MINUTES,
  normalizeOffsets,
} from '@/domain';
import type { RootStackParamList } from '@/navigation/types';
import { expoPermissionChecker, haptics, type NotificationPermissionStatus } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles, useTheme } from '@/theme';

const QUICK_ADD_PRESETS: readonly number[] = [15, 30, 60, 120, 1440];

export function ReminderSettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const settings = useSettingsStore(selectSettings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('granted');
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

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
    const newStatus = await expoPermissionChecker.requestPermission();
    setPermissionStatus(newStatus);
  };

  const remindersEnabled = settings?.remindersEnabled ?? true;
  const currentOffsets = settings?.defaultMinutesBefore ?? [];
  const sortedOffsets = [...currentOffsets].sort((a, b) => b - a);

  const handleToggleReminders = async (enabled: boolean): Promise<void> => {
    haptics.selection();
    await useSettingsStore.getState().updateSettings({
      remindersEnabled: enabled,
    });
  };

  const handleRemoveOffset = async (offsetMinutes: number): Promise<void> => {
    haptics.selection();
    const updated = currentOffsets.filter((m) => m !== offsetMinutes);
    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: updated,
    });
  };

  const handleAddOffset = async (offsetMinutes: number): Promise<void> => {
    if (currentOffsets.includes(offsetMinutes)) {
      return;
    }
    haptics.selection();
    const updated = normalizeOffsets([...currentOffsets, offsetMinutes]);
    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: updated,
    });
  };

  const handleAddCustom = async (): Promise<void> => {
    const parsed = parseInt(customInput.trim(), 10);
    if (!isValidOffset(parsed)) {
      setCustomError(`Enter a valid whole number between 1 and ${MAX_REMINDER_OFFSET_MINUTES}`);
      haptics.warning();
      return;
    }

    setCustomError(null);
    setCustomInput('');
    await handleAddOffset(parsed);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={styles.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={24} tone="text" />
        </Pressable>
        <Text variant="title" style={styles.headerTitle}>
          Reminder Settings
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {permissionStatus !== 'granted' ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Icon name="alert-circle" size={20} tone="accent" />
              <Text variant="bodySmall" weight="semibold" tone="text">
                Notifications Disabled
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              Permissions are not granted. Reminders cannot be delivered until notifications are
              enabled.
            </Text>
            <Button
              label="Enable Notifications"
              variant="secondary"
              onPress={() => void handleRequestPermission()}
              accessibilityLabel="Enable Notifications"
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelGroup}>
              <Text variant="body" weight="semibold">
                Enable Shift Reminders
              </Text>
              <Text variant="caption" tone="muted">
                Receive local notifications before shifts begin
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={(val) => void handleToggleReminders(val)}
              accessibilityLabel="Enable Shift Reminders"
            />
          </View>
        </View>

        {remindersEnabled ? (
          <>
            <View style={styles.sectionHeader}>
              <Text variant="body" weight="semibold">
                Active Reminder Intervals
              </Text>
              <Text variant="caption" tone="muted">
                Notification offsets scheduled for each upcoming shift
              </Text>
            </View>

            <View style={styles.card}>
              {sortedOffsets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text variant="caption" tone="muted">
                    No active reminders. Tap a quick add option below.
                  </Text>
                </View>
              ) : (
                sortedOffsets.map((minutes, index) => (
                  <View key={`offset-${minutes}`}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.intervalRow}>
                      <View style={styles.intervalLeft}>
                        <Icon name="bell" size={20} tone="muted" />
                        <Text variant="body">{formatTimeUntil(minutes)} before</Text>
                      </View>
                      <Pressable
                        style={styles.removeButton}
                        onPress={() => void handleRemoveOffset(minutes)}
                        hitSlop={styles.hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${formatTimeUntil(minutes)} reminder`}
                      >
                        <Icon name="x" size={20} tone="muted" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text variant="body" weight="semibold">
                Quick Add
              </Text>
            </View>

            <View style={styles.quickAddRow}>
              {QUICK_ADD_PRESETS.map((minutes) => {
                const isSelected = currentOffsets.includes(minutes);
                return (
                  <Chip
                    key={`quick-${minutes}`}
                    label={formatTimeUntil(minutes)}
                    selected={isSelected}
                    disabled={isSelected}
                    onPress={() => void handleAddOffset(minutes)}
                    accessibilityLabel={`Add ${formatTimeUntil(minutes)} reminder`}
                  />
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text variant="body" weight="semibold">
                Custom Interval
              </Text>
            </View>

            <View style={styles.customContainer}>
              <TextInput
                style={[styles.input, customError !== null ? styles.inputError : null]}
                placeholder="Minutes before shift"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={customInput}
                onChangeText={(text) => {
                  setCustomInput(text);
                  if (customError !== null) {
                    setCustomError(null);
                  }
                }}
                accessibilityLabel="Custom reminder minutes input"
              />
              <Button
                label="Add"
                variant="secondary"
                onPress={() => void handleAddCustom()}
                disabled={customInput.trim().length === 0}
                accessibilityLabel="Add custom reminder interval"
              />
            </View>
            {customError !== null ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {customError}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={styles.disclaimerContainer}>
          <Text variant="caption" tone="muted">
            Shift reminders are scheduled as local notifications. Notification delivery may be
            silenced or delayed by device battery optimizations, Do Not Disturb, or Focus settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default ReminderSettingsScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  backButton: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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
  sectionHeader: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  emptyState: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.sizes.touchTarget,
  },
  intervalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  removeButton: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  customContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: theme.sizes.touchTarget,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    marginTop: -theme.spacing.xs,
  },
  disclaimerContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
