import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { SHIFT_SYSTEM_PRESETS, type ShiftSystemPresetId } from '@/constants';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import type { SchedulePatternType } from '../../types';

export interface StepScheduleTypeProps {
  readonly presetId: ShiftSystemPresetId;
  readonly scheduleType: SchedulePatternType;
  readonly onSelectScheduleType: (type: SchedulePatternType) => void;
  readonly selectedRotationOptionId: string | null;
  readonly onSelectRotationOptionId: (id: string) => void;
}

export function StepScheduleType({
  presetId,
  scheduleType,
  onSelectScheduleType,
  selectedRotationOptionId,
  onSelectRotationOptionId,
}: StepScheduleTypeProps): ReactElement {
  const styles = useStyles();

  const currentPreset =
    SHIFT_SYSTEM_PRESETS.find((p) => p.id === presetId) ?? SHIFT_SYSTEM_PRESETS[0];
  const rotationOptions = currentPreset?.rotationOptions ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          How is your schedule structured?
        </Text>
        <Text variant="caption" tone="muted">
          Choose how you populate your calendar. You can always create rotations or log one-off
          shifts later.
        </Text>
      </View>

      <View style={styles.optionsList}>
        {/* Option A: Variable / Monthly Roster */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            scheduleType === 'variable' && styles.cardSelected,
            pressed && styles.cardPressed,
          ]}
          onPress={() => onSelectScheduleType('variable')}
          accessibilityRole="button"
          accessibilityLabel={`Variable or Monthly Roster. I enter shifts as my schedule comes out. ${scheduleType === 'variable' ? 'Selected' : 'Tap to select'}`}
          accessibilityState={{ selected: scheduleType === 'variable' }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="calendar" size={20} tone="text" />
            </View>
            <View style={styles.titleGroup}>
              <Text variant="body" weight="semibold">
                Variable / Monthly Roster
              </Text>
              <Text variant="caption" tone="muted">
                I enter shifts as my monthly or bi-weekly schedule comes out
              </Text>
            </View>
            <View
              style={[
                styles.radioCircle,
                scheduleType === 'variable' && styles.radioCircleSelected,
              ]}
            >
              {scheduleType === 'variable' ? <Icon name="check" size={16} tone="onAccent" /> : null}
            </View>
          </View>
        </Pressable>

        {/* Option B: Repeating Rotation */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            scheduleType === 'rotation' && styles.cardSelected,
            pressed && styles.cardPressed,
          ]}
          onPress={() => onSelectScheduleType('rotation')}
          accessibilityRole="button"
          accessibilityLabel={`Repeating Rotation. My shifts repeat in a regular cycle. ${scheduleType === 'rotation' ? 'Selected' : 'Tap to select'}`}
          accessibilityState={{ selected: scheduleType === 'rotation' }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Icon name="repeat" size={20} tone="text" />
            </View>
            <View style={styles.titleGroup}>
              <Text variant="body" weight="semibold">
                Repeating Rotation
              </Text>
              <Text variant="caption" tone="muted">
                My shifts repeat in a regular, cyclical pattern anchored to a start date
              </Text>
            </View>
            <View
              style={[
                styles.radioCircle,
                scheduleType === 'rotation' && styles.radioCircleSelected,
              ]}
            >
              {scheduleType === 'rotation' ? <Icon name="check" size={16} tone="onAccent" /> : null}
            </View>
          </View>

          {/* Quick-select rotation pattern chips */}
          {scheduleType === 'rotation' ? (
            <View style={styles.patternSection}>
              <View style={styles.patternDivider} />
              <Text variant="caption" weight="semibold" tone="muted">
                SELECT A ROTATION PATTERN
              </Text>
              <View style={styles.chipGrid}>
                {rotationOptions.map((opt) => {
                  const isChipSelected = selectedRotationOptionId === opt.id;
                  return (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      iconName={opt.isCustom ? 'sliders' : 'repeat'}
                      selected={isChipSelected}
                      onPress={() => onSelectRotationOptionId(opt.id)}
                      accessibilityLabel={`${opt.label} pattern. ${isChipSelected ? 'Selected' : 'Tap to select'}`}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  optionsList: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceRaised,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  patternSection: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  patternDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
}));
