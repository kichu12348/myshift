import { useEffect, useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { normalizeOffsets } from '@/domain';
import type { RootStackParamList } from '@/navigation/types';
import { expoPermissionChecker, haptics, type NotificationPermissionStatus } from '@/services';
import { selectSettings, useSettingsStore } from '@/store';
import { makeStyles } from '@/theme';
import { CustomOffsetCard } from './components/CustomOffsetCard';
import { MasterToggleCard } from './components/MasterToggleCard';
import { ReminderOffsetsCard } from './components/ReminderOffsetsCard';
import { ReminderPreviewCard } from './components/ReminderPreviewCard';

export function ReminderSettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const settings = useSettingsStore(selectSettings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('granted');

  const remindersEnabled = settings?.remindersEnabled ?? true;
  const currentOffsets = settings?.defaultMinutesBefore ?? [];
  const timeFormat = settings?.timeFormat ?? '24h';

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

  const handleToggleReminders = async (enabled: boolean): Promise<void> => {
    haptics.selection();
    if (enabled) {
      const status = await expoPermissionChecker.requestPermission();
      setPermissionStatus(status);
    }
    await useSettingsStore.getState().updateSettings({
      remindersEnabled: enabled,
    });
  };

  const handleToggleOffset = async (minutes: number): Promise<void> => {
    haptics.selection();
    const exists = currentOffsets.includes(minutes);
    const updated = exists
      ? currentOffsets.filter((m) => m !== minutes)
      : [...currentOffsets, minutes];
    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: normalizeOffsets(updated),
    });
  };

  const handleAddOffset = async (minutes: number): Promise<void> => {
    haptics.selection();
    const updated = normalizeOffsets([...currentOffsets, minutes]);
    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: updated,
    });
  };

  const handleRemoveOffset = async (minutes: number): Promise<void> => {
    haptics.selection();
    const updated = currentOffsets.filter((m) => m !== minutes);
    await useSettingsStore.getState().updateSettings({
      defaultMinutesBefore: normalizeOffsets(updated),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <Text variant="title" weight="semibold">
            Shift Reminders
          </Text>
        </View>
        {remindersEnabled ? (
          <View style={styles.statusBadge}>
            <Text variant="caption" weight="semibold" tone="accent" tabularNums>
              {`${currentOffsets.length} active`}
            </Text>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <MasterToggleCard
            remindersEnabled={remindersEnabled}
            permissionStatus={permissionStatus}
            onToggleReminders={(val) => void handleToggleReminders(val)}
            onRequestPermission={() => void handleRequestPermission()}
          />

          <ReminderOffsetsCard
            remindersEnabled={remindersEnabled}
            activeOffsets={currentOffsets}
            onToggleOffset={(val) => void handleToggleOffset(val)}
          />

          <CustomOffsetCard
            remindersEnabled={remindersEnabled}
            activeOffsets={currentOffsets}
            onAddOffset={(val) => void handleAddOffset(val)}
            onRemoveOffset={(val) => void handleRemoveOffset(val)}
          />

          <ReminderPreviewCard
            remindersEnabled={remindersEnabled}
            activeOffsets={currentOffsets}
            timeFormat={timeFormat}
          />

          <View style={styles.disclaimerContainer}>
            <Text variant="caption" tone="muted">
              Shift reminders are scheduled as local notifications. Notification delivery may be
              silenced or delayed by device battery optimizations, Do Not Disturb, or Focus settings.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  disclaimerContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
}));
