import type { ReactElement } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { isOvernightShift, isTimeOfDay, timeOfDayToMinutes } from '@/domain';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

const BREAK_OPTIONS = [0, 15, 30, 45, 60] as const;

export interface TemplateScheduleCardProps {
  readonly startTime: string;
  readonly onChangeStartTime: (time: string) => void;
  readonly endTime: string;
  readonly onChangeEndTime: (time: string) => void;
  readonly breakMinutes: number;
  readonly onChangeBreakMinutes: (minutes: number) => void;
  readonly hourlyRate: string;
  readonly onChangeHourlyRate: (rate: string) => void;
  readonly errors?: {
    readonly startTime?: string | undefined;
    readonly endTime?: string | undefined;
    readonly breakMinutes?: string | undefined;
    readonly hourlyRate?: string | undefined;
  } | undefined;
}

export function TemplateScheduleCard({
  startTime,
  onChangeStartTime,
  endTime,
  onChangeEndTime,
  breakMinutes,
  onChangeBreakMinutes,
  hourlyRate,
  onChangeHourlyRate,
  errors,
}: TemplateScheduleCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const validStart = isTimeOfDay(startTime) ? startTime : '07:00';
  const validEnd = isTimeOfDay(endTime) ? endTime : '15:00';
  const startM = timeOfDayToMinutes(validStart);
  const endM = timeOfDayToMinutes(validEnd);
  const isOvernight = isOvernightShift(startM, endM, false);

  const handleSelectBreak = (mins: number): void => {
    haptics.selection();
    onChangeBreakMinutes(mins);
  };

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
          <TextInput
            value={startTime}
            onChangeText={onChangeStartTime}
            placeholder="07:00"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.timeInput]}
            accessibilityLabel="Start time"
            autoCapitalize="none"
          />
        </View>

        {errors?.startTime !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {errors.startTime}
            </Text>
          </View>
        ) : null}

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

          <TextInput
            value={endTime}
            onChangeText={onChangeEndTime}
            placeholder="15:00"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.timeInput]}
            accessibilityLabel="End time"
            autoCapitalize="none"
          />
        </View>

        {errors?.endTime !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {errors.endTime}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.breakRow}>
          <Text variant="body" weight="semibold" style={styles.label}>
            Unpaid Break
          </Text>
          <View style={styles.breakOptions}>
            {BREAK_OPTIONS.map((mins) => {
              const isSelected = breakMinutes === mins;
              return (
                <Pressable
                  key={mins}
                  accessibilityRole="button"
                  accessibilityLabel={`Break ${mins} minutes`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelectBreak(mins)}
                  style={[styles.breakPill, isSelected && styles.breakPillActive]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    tone={isSelected ? 'onAccent' : 'text'}
                    tabularNums
                  >
                    {`${mins}m`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {errors?.breakMinutes !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {errors.breakMinutes}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text variant="body" weight="semibold" style={styles.label}>
            Hourly Rate ($)
          </Text>
          <TextInput
            value={hourlyRate}
            onChangeText={onChangeHourlyRate}
            placeholder="e.g. 35.50"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, styles.timeInput]}
            accessibilityLabel="Hourly rate"
          />
        </View>

        {errors?.hourlyRate !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {errors.hourlyRate}
            </Text>
          </View>
        ) : null}
      </View>
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
  input: {
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    paddingVertical: theme.spacing.sm,
  },
  timeInput: {
    fontVariant: theme.typography.fontVariant.tabularNums,
    textAlign: 'right',
    minWidth: 80,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
    gap: theme.spacing.md,
  },
  breakOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  breakPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    minWidth: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
}));
