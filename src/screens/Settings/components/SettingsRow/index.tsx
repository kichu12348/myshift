import type { ReactElement, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text, type TextTone } from '@/components/Text';
import { makeStyles } from '@/theme';

export type SettingsRowTone = 'accent' | 'danger' | 'default';

export interface SettingsRowProps {
  readonly icon: IconName;
  readonly title: string;
  readonly subtitle?: string;
  readonly rightElement?: ReactNode;
  readonly trailing?: ReactNode;
  readonly showChevron?: boolean;
  readonly iconTone?: TextTone;
  readonly tone?: SettingsRowTone;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  rightElement,
  trailing,
  showChevron = false,
  iconTone = 'accent',
  tone = 'accent',
  onPress,
  accessibilityLabel,
  testID,
}: SettingsRowProps): ReactElement {
  const styles = useStyles();

  const isDanger = tone === 'danger';
  const resolvedIconTone: TextTone = isDanger ? 'danger' : iconTone;
  const accessory = rightElement ?? trailing;
  const hasAccessory = accessory !== undefined && accessory !== null;

  const content = (
    <>
      <View style={[styles.badge, isDanger ? styles.badgeDanger : styles.badgeAccent]}>
        <Icon name={icon} size={24} tone={resolvedIconTone} />
      </View>
      <View style={styles.textContainer}>
        <Text variant="body" weight="semibold" tone={isDanger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle !== undefined && subtitle.length > 0 ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {hasAccessory || showChevron ? (
        <View style={styles.accessoryContainer}>
          {accessory}
          {showChevron ? (
            <Icon name="chevron-right" size={20} tone={isDanger ? 'danger' : 'muted'} />
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={styles.row}>
      {content}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  badge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  badgeDanger: {
    backgroundColor: `${theme.colors.danger}1F`,
  },
  textContainer: {
    flex: 1,
    minWidth: theme.sizes.rowTextMinWidth,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  accessoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
    gap: theme.spacing.sm,
  },
}));
