import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import type { NotificationPermissionStatus } from '@/services';
import { makeStyles } from '@/theme';

export interface MasterToggleCardProps {
  readonly remindersEnabled: boolean;
  readonly permissionStatus: NotificationPermissionStatus;
  readonly onToggleReminders: (enabled: boolean) => void;
  readonly onRequestPermission: () => void;
}

export function MasterToggleCard({
  remindersEnabled,
  permissionStatus,
  onToggleReminders,
  onRequestPermission,
}: MasterToggleCardProps): ReactElement {
  const styles = useStyles();
  const showWarning = remindersEnabled && permissionStatus !== 'granted';

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        NOTIFICATIONS
      </Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Icon name="bell" size={20} tone="accent" />
          </View>
          <View style={styles.centerStack}>
            <Text variant="body" weight="semibold">
              Enable Reminders
            </Text>
            <Text variant="caption" tone="muted">
              {remindersEnabled
                ? 'Alerts scheduled before working shifts'
                : 'All shift alerts are currently paused'}
            </Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={onToggleReminders}
            accessibilityLabel="Enable Shift Reminders"
          />
        </View>

        {showWarning ? (
          <>
            <View style={styles.divider} />
            <View style={styles.warningRow}>
              <View style={styles.warningBadge}>
                <Icon name="alert-circle" size={20} tone="warning" />
              </View>
              <View style={styles.centerStack}>
                <Text variant="bodySmall" weight="semibold">
                  Notifications blocked by system
                </Text>
                <Text variant="caption" tone="muted">
                  Tap to allow alerts
                </Text>
              </View>
              <TextButton
                label="Enable"
                tone="accent"
                onPress={onRequestPermission}
                accessibilityLabel="Enable Notifications"
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.settingsRowMinHeight,
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: theme.sizes.settingsRowMinHeight,
    gap: theme.spacing.md,
  },
  warningBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

