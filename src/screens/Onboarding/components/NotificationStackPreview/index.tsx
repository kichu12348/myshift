import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

interface NotificationCardData {
  readonly interval: string;
  readonly title: string;
  readonly body: string;
  readonly tone: 'accent' | 'secondary' | 'warning';
}

const NOTIFICATIONS: readonly NotificationCardData[] = [
  {
    interval: '60m before',
    title: 'Day Shift in 1 hour',
    body: 'Starts at 07:00 · Pack bag & commute',
    tone: 'accent',
  },
  {
    interval: '30m before',
    title: 'Day Shift in 30 minutes',
    body: 'Time to head out and travel',
    tone: 'secondary',
  },
  {
    interval: '15m before',
    title: 'Day Shift in 15 minutes',
    body: 'Handover & clock-in ready',
    tone: 'warning',
  },
];

export function NotificationStackPreview(): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container} accessibilityLabel="Multi-reminder cascade preview">
      <View style={styles.headerRow}>
        <Icon name="bell" size={16} tone="accent" />
        <Text variant="caption" weight="semibold" tone="text">
          MULTI-REMINDER CASCADE PREVIEW
        </Text>
      </View>

      <View style={styles.stack}>
        {NOTIFICATIONS.map((item, index) => {
          const borderStyle =
            item.tone === 'accent'
              ? styles.cardAccent
              : item.tone === 'secondary'
                ? styles.cardSecondary
                : styles.cardWarning;

          const badgeStyle =
            item.tone === 'accent'
              ? styles.badgeAccent
              : item.tone === 'secondary'
                ? styles.badgeSecondary
                : styles.badgeWarning;

          return (
            <View key={`notif-card-${index}`} style={[styles.card, borderStyle]}>
              <View style={[styles.iconBadge, badgeStyle]}>
                <Icon name="bell" size={16} tone={item.tone} />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text variant="bodySmall" weight="semibold" tone="text">
                    {item.title}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {item.interval}
                  </Text>
                </View>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.body}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stack: {
    gap: theme.spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderLeftWidth: theme.sizes.selectedBorder,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  cardAccent: {
    borderLeftColor: theme.colors.accent,
  },
  cardSecondary: {
    borderLeftColor: theme.colors.secondary,
  },
  cardWarning: {
    borderLeftColor: theme.colors.warning,
  },
  iconBadge: {
    width: theme.sizes.iconBadgeSmall,
    height: theme.sizes.iconBadgeSmall,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  badgeSecondary: {
    backgroundColor: `${theme.colors.secondary}1A`,
  },
  badgeWarning: {
    backgroundColor: `${theme.colors.warning}1A`,
  },
  textContainer: {
    flex: 1,
    gap: theme.sizes.size1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));
