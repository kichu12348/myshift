import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { formatMinutesToTime, isOvernightShift } from '@/domain';
import { BreakDurationPicker } from '@/components/BreakDurationPicker';
import { Text } from '@/components/Text';
import { TimePickerModal } from '@/components/TimePickerModal';
import { makeStyles } from '@/theme';

export interface ShiftScheduleCardProps {
  readonly startMinutes: number;
  readonly onChangeStartMinutes: (minutes: number) => void;
  readonly endMinutes: number;
  readonly onChangeEndMinutes: (minutes: number) => void;
  readonly breakMinutes: number;
  readonly onChangeBreakMinutes: (minutes: number) => void;
  readonly timeFormat: '12h' | '24h';
  readonly isOff: boolean;
  readonly error?: string | undefined;
}

export function ShiftScheduleCard({
  startMinutes,
  onChangeStartMinutes,
  endMinutes,
  onChangeEndMinutes,
  breakMinutes,
  onChangeBreakMinutes,
  timeFormat,
  isOff,
  error,
}: ShiftScheduleCardProps): ReactElement {
  const styles = useStyles();

  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const isOvernight = isOvernightShift(startMinutes, endMinutes, isOff);

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        HOURS &amp; BREAK
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text variant="body" weight="semibold" style={styles.label}>
            Start Time
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change start time, currently ${formatMinutesToTime(startMinutes, timeFormat)}`}
            onPress={() => setPickerTarget('start')}
            style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
          >
            <Text variant="body" weight="semibold" tone="accent" tabularNums>
              {formatMinutesToTime(startMinutes, timeFormat)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.labelWithBadge}>
            <Text variant="body" weight="semibold" style={styles.label}>
              End Time
            </Text>
            {isOvernight ? (
              <View style={styles.overnightBadge}>
                <Text variant="micro" tone="accent" weight="semibold">
                  Next day (+1d)
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change end time, currently ${formatMinutesToTime(endMinutes, timeFormat)}`}
            onPress={() => setPickerTarget('end')}
            style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
          >
            <Text variant="body" weight="semibold" tone="accent" tabularNums>
              {formatMinutesToTime(endMinutes, timeFormat)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <BreakDurationPicker
          breakMinutes={breakMinutes}
          onChangeBreakMinutes={onChangeBreakMinutes}
          error={error}
        />
      </View>

      <TimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? 'Start Time' : 'End Time'}
        initialMinutes={pickerTarget === 'start' ? startMinutes : endMinutes}
        timeFormat={timeFormat}
        onConfirm={(mins) => {
          if (pickerTarget === 'start') {
            onChangeStartMinutes(mins);
          } else if (pickerTarget === 'end') {
            onChangeEndMinutes(mins);
          }
        }}
        onClose={() => setPickerTarget(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    gap: theme.spacing.md,
  },
  label: {
    minWidth: theme.sizes.rowTextMinWidth,
  },
  labelWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  overnightBadge: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  timePill: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePillPressed: {
    opacity: 0.7,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
}));
