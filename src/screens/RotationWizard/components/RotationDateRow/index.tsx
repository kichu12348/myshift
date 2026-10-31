import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface RotationDateRowProps {
  readonly iconName: IconName;
  readonly title: string;
  readonly subtitle: string;
  readonly dateLabel: string;
  readonly onOpenPicker: () => void;
  readonly accessibilityLabel: string;
  readonly isMutedLabel?: boolean | undefined;
  readonly onPrevDay?: (() => void) | undefined;
  readonly onNextDay?: (() => void) | undefined;
  readonly onSetToday?: (() => void) | undefined;
  readonly isToday?: boolean | undefined;
  readonly onClear?: (() => void) | undefined;
}

export function RotationDateRow({
  iconName,
  title,
  subtitle,
  dateLabel,
  onOpenPicker,
  accessibilityLabel,
  isMutedLabel = false,
  onPrevDay,
  onNextDay,
  onSetToday,
  isToday = false,
  onClear,
}: RotationDateRowProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Icon name={iconName} size={20} tone="accent" />
        </View>
        <View style={styles.titleStack}>
          <Text variant="body" weight="semibold">
            {title}
          </Text>
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        {onPrevDay !== undefined ? (
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Previous day"
            onPress={onPrevDay}
          />
        ) : null}

        <Pressable
          style={[styles.pillBase, styles.datePill]}
          onPress={onOpenPicker}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Text
            variant="bodySmall"
            weight="semibold"
            tone={isMutedLabel ? 'muted' : 'text'}
            tabularNums={!isMutedLabel}
          >
            {dateLabel}
          </Text>
        </Pressable>

        {onNextDay !== undefined ? (
          <IconButton iconName="chevron-right" accessibilityLabel="Next day" onPress={onNextDay} />
        ) : null}

        {onSetToday !== undefined ? (
          <Pressable
            onPress={onSetToday}
            style={[styles.pillBase, isToday && styles.todayChipActive]}
            accessibilityRole="button"
            accessibilityLabel="Set date to today"
          >
            <Text variant="caption" weight="semibold" tone={isToday ? 'accent' : 'muted'}>
              Today
            </Text>
          </Pressable>
        ) : null}

        {onClear !== undefined ? (
          <Pressable
            onPress={onClear}
            style={styles.pillBase}
            accessibilityRole="button"
            accessibilityLabel="Clear end date to ongoing"
          >
            <Text variant="caption" weight="semibold" tone="muted">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  titleStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pillBase: {
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  todayChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
}));
