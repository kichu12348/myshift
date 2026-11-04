import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import type { LocalDate } from '@/domain';
import { makeStyles } from '@/theme';
import { formatDateWithMonthShort } from '@/utils';
import { PayPeriodDateRow } from './components/PayPeriodDateRow';

export interface PayPeriodDatesCardProps {
  readonly startDate: string;
  readonly endDate: string;
  readonly onChangeStartDate?: ((date: string) => void) | undefined;
  readonly onChangeEndDate?: ((date: string) => void) | undefined;
  readonly onSelectPreset: (preset: 'full' | '25th' | '20th') => void;
  readonly onOpenDatePicker: (target: 'start' | 'end') => void;
}

export function PayPeriodDatesCard({
  startDate,
  endDate,
  onSelectPreset,
  onOpenDatePicker,
}: PayPeriodDatesCardProps): ReactElement {
  const styles = useStyles();

  const formattedStart = formatDateWithMonthShort(startDate as LocalDate);
  const formattedEnd = formatDateWithMonthShort(endDate as LocalDate);

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" weight="semibold">
        PAY PERIOD DATES
      </Text>
      <Text variant="caption" tone="muted">
        Define start date and payday end date for shift earnings.
      </Text>

      {/* Quick Preset Pills */}
      <View style={styles.presetsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Full calendar month preset"
          onPress={() => onSelectPreset('full')}
          style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Text variant="caption" weight="semibold" tone="muted">
            Full Month
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="25th to 25th preset"
          onPress={() => onSelectPreset('25th')}
          style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Text variant="caption" weight="semibold" tone="muted">
            25th to 25th
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="20th to 20th preset"
          onPress={() => onSelectPreset('20th')}
          style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Text variant="caption" weight="semibold" tone="muted">
            20th to 20th
          </Text>
        </Pressable>
      </View>

      {/* Dates Card */}
      <View style={styles.card}>
        <PayPeriodDateRow
          label="Start Date"
          dateFormatted={formattedStart}
          onOpenPicker={() => onOpenDatePicker('start')}
          testPillLabel={`Select start date ${formattedStart}`}
        />

        <View style={styles.divider} />

        <PayPeriodDateRow
          label="End Date (Payday)"
          dateFormatted={formattedEnd}
          onOpenPicker={() => onOpenDatePicker('end')}
          testPillLabel={`Select end date ${formattedEnd}`}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  presetPill: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.segmentedControlHeight,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
