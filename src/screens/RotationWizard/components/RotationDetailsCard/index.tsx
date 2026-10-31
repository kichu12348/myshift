import { useState, type ReactElement } from 'react';
import { TextInput, View } from 'react-native';
import { DatePickerModal } from '@/components/DatePickerModal';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { LocalDate } from '@/domain';
import { makeStyles, useTheme } from '@/theme';
import { RotationDateRow } from '../RotationDateRow';

export interface RotationDetailsCardProps {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly startDate: LocalDate;
  readonly onChangeStartDate: (date: LocalDate) => void;
  readonly endDate: LocalDate | null;
  readonly onChangeEndDate: (date: LocalDate | null) => void;
  readonly isEditingExisting: boolean;
  readonly today: LocalDate;
  readonly error?: string | undefined;
}

export function RotationDetailsCard({
  name,
  onChangeName,
  startDate,
  onChangeStartDate,
  endDate,
  onChangeEndDate,
  isEditingExisting,
  error,
}: RotationDetailsCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold">
        ROTATION DETAILS
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Icon name="repeat" size={20} tone="accent" />
          </View>
          <View style={styles.textStack}>
            <Text variant="caption" tone="muted" weight="semibold">
              Pattern Name
            </Text>
            <TextInput
              value={name}
              onChangeText={onChangeName}
              placeholder="e.g. 4-On 4-Off, Continental"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.nameInput}
              accessibilityLabel="Rotation name"
            />
          </View>
        </View>

        {error !== undefined ? (
          <View style={styles.errorContainer}>
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <RotationDateRow
          iconName="calendar"
          title={isEditingExisting ? 'Effective From' : 'Start Date (Day 1)'}
          subtitle="Past shifts before this date stay untouched"
          dateLabel={startDate}
          onPress={() => setActivePicker('start')}
          accessibilityLabel={isEditingExisting ? 'Effective from date' : 'Rotation start date'}
        />

        <View style={styles.divider} />

        <RotationDateRow
          iconName="flag"
          title="End Date"
          subtitle={
            endDate !== null ? 'Rotation concludes after this date' : 'Ongoing repeating schedule'
          }
          dateLabel={endDate ?? 'Ongoing'}
          isMuted={endDate === null}
          onPress={() => setActivePicker('end')}
          accessibilityLabel="Rotation end date"
          onClear={endDate !== null ? () => onChangeEndDate(null) : undefined}
        />
      </View>

      <DatePickerModal
        visible={activePicker === 'start'}
        title={isEditingExisting ? 'Effective From Date' : 'Rotation Start Date'}
        selectedDate={startDate}
        onConfirm={onChangeStartDate}
        onClose={() => setActivePicker(null)}
      />

      <DatePickerModal
        visible={activePicker === 'end'}
        title="Rotation End Date"
        selectedDate={endDate ?? startDate}
        minDate={startDate}
        allowClear={true}
        onClear={() => onChangeEndDate(null)}
        onConfirm={onChangeEndDate}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.sm,
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
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textStack: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  nameInput: {
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
}));
