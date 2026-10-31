import { Fragment, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface ReminderPreset {
  readonly minutes: number;
  readonly badge: string;
  readonly label: string;
  readonly description: string;
}

export const REMINDER_PRESETS: readonly ReminderPreset[] = [
  {
    minutes: 15,
    badge: '15m',
    label: '15 minutes before',
    description: 'Quick heads-up right before shift',
  },
  {
    minutes: 30,
    badge: '30m',
    label: '30 minutes before',
    description: 'Time to commute & prepare',
  },
  {
    minutes: 60,
    badge: '60m',
    label: '1 hour before',
    description: 'Standard wake-up or pre-shift window',
  },
  {
    minutes: 120,
    badge: '2h',
    label: '2 hours before',
    description: 'Extended commute or prep time',
  },
  {
    minutes: 720,
    badge: '12h',
    label: '12 hours before',
    description: 'Half-day heads-up for schedule changes',
  },
  {
    minutes: 1440,
    badge: '24h',
    label: '1 day before',
    description: 'Evening before an early shift',
  },
];

export interface ReminderOffsetsCardProps {
  readonly remindersEnabled: boolean;
  readonly activeOffsets: readonly number[];
  readonly onToggleOffset: (minutes: number) => void;
}

export function ReminderOffsetsCard({
  remindersEnabled,
  activeOffsets,
  onToggleOffset,
}: ReminderOffsetsCardProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        DEFAULT ALERT TIMING
      </Text>
      <View style={[styles.card, !remindersEnabled && styles.cardDisabled]}>
        {REMINDER_PRESETS.map((preset, index) => {
          const isSelected = activeOffsets.includes(preset.minutes);
          return (
            <Fragment key={`preset-${preset.minutes}`}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={({ pressed }) => [styles.row, pressed && remindersEnabled && styles.pressed]}
                onPress={() => onToggleOffset(preset.minutes)}
                disabled={!remindersEnabled}
                accessibilityRole="checkbox"
                accessibilityLabel={preset.label}
                accessibilityState={{ checked: isSelected, disabled: !remindersEnabled }}
              >
                <View
                  style={[
                    styles.badge,
                    isSelected ? styles.badgeSelected : styles.badgeUnselected,
                  ]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    tone={isSelected ? 'accent' : 'muted'}
                    tabularNums
                  >
                    {preset.badge}
                  </Text>
                </View>
                <View style={styles.centerStack}>
                  <Text variant="body" weight="semibold">
                    {preset.label}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {preset.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkContainer,
                    isSelected ? styles.checkSelected : styles.checkUnselected,
                  ]}
                >
                  {isSelected ? <Icon name="check" size={18} tone="accent" /> : null}
                </View>
              </Pressable>
            </Fragment>
          );
        })}
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
  cardDisabled: {
    opacity: 0.45,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.settingsRowMinHeight,
    gap: theme.spacing.md,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  badge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  badgeUnselected: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
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
  checkContainer: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: theme.colors.accentSoft,
  },
  checkUnselected: {
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
}));

