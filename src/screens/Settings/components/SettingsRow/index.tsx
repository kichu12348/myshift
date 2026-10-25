import type { ReactElement, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text, type TextTone } from '@/components/Text';
import { makeStyles } from '@/theme';

export type SettingsRowTone = 'default' | 'danger';

export interface SettingsRowProps {
  readonly icon: IconName;
  readonly iconTone?: TextTone;
  readonly title: string;
  readonly subtitle?: string;
  readonly tone?: SettingsRowTone;
  readonly trailing?: ReactNode;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
}

export function SettingsRow({
  icon,
  iconTone = 'accent',
  title,
  subtitle,
  tone = 'default',
  trailing,
  onPress,
  accessibilityLabel,
}: SettingsRowProps): ReactElement {
  const styles = useStyles();

  const isDanger = tone === 'danger';
  const resolvedIconTone: TextTone = isDanger ? 'danger' : iconTone;

  const badgeStyle = isDanger
    ? styles.badgeDanger
    : iconTone === 'accent'
      ? styles.badgeAccent
      : styles.badgeDefault;

  const content = (
    <>
      <View style={[styles.badge, badgeStyle]}>
        <Icon name={icon} size={20} tone={resolvedIconTone} />
      </View>
      <View style={styles.textContainer}>
        <Text variant="body" weight="semibold" tone={isDanger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle !== undefined && subtitle.length > 0 ? (
          <Text variant="bodySmall" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing !== undefined && trailing !== null ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : null}
    </>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row}>
      {content}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: theme.sizes.settingsRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  rowPressed: {
    opacity: 0.65,
  },
  badge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeDefault: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  badgeDanger: {
    backgroundColor: theme.colors.dangerSoft,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
