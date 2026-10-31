import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { SHIFT_SYSTEM_PRESETS, isShiftIconName, type ShiftSystemPresetId } from '@/constants';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme, makeStyles } from '@/theme';
import { TwoWeekRibbon } from '../TwoWeekRibbon';
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
  const { theme } = useTheme();
  const styles = useStyles();

  const currentPreset =
    SHIFT_SYSTEM_PRESETS.find((p) => p.id === presetId) ?? SHIFT_SYSTEM_PRESETS[0];
  const rotationOptions = currentPreset?.rotationOptions ?? [];
  const selectedOption = rotationOptions.find((opt) => opt.id === selectedRotationOptionId);
  const activePattern = selectedOption?.pattern ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          How is your schedule structured?
        </Text>
        <Text variant="caption" tone="muted">
          Choose how you populate your calendar. You can build repeating rotations or log shifts
          freely.
        </Text>
      </View>

      {/* 14-Day Two-Week Color Ribbon Preview */}
      <TwoWeekRibbon
        pattern={activePattern}
        templates={currentPreset?.templates ?? []}
        isVariable={scheduleType === 'variable'}
      />

      <View style={styles.optionsList}>
        {/* Repeating Rotation */}
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
              <Icon name="repeat" size={20} tone="accent" />
            </View>
            <View style={styles.titleGroup}>
              <Text variant="body" weight="semibold">
                Repeating Rotation
              </Text>
              <Text variant="caption" tone="muted">
                My shifts repeat in a regular cycle anchored to a date
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

              <Text variant="caption" weight="semibold" tone="muted" style={styles.paletteHeader}>
                STARTER SHIFTS
              </Text>
              <View style={styles.templateButtonRow}>
                {currentPreset?.templates.map((tpl) => {
                  const resolved = resolveShiftColor(tpl.color, theme.mode);
                  const iconName = isShiftIconName(tpl.icon) ? tpl.icon : 'clock';
                  return (
                    <View
                      key={tpl.id}
                      style={[
                        styles.templateBadge,
                        {
                          backgroundColor: `${resolved}${SHIFT_PILL_FILL_ALPHA}`,
                          borderColor: resolved,
                        },
                      ]}
                    >
                      <Icon name={iconName} size={16} tone="text" />
                      <Text variant="caption" weight="semibold" tone="text">
                        {tpl.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </Pressable>

        {/* Variable / Monthly Roster */}
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
              <Icon name="calendar" size={20} tone="secondary" />
            </View>
            <View style={styles.titleGroup}>
              <Text variant="body" weight="semibold">
                Variable / Monthly Roster
              </Text>
              <Text variant="caption" tone="muted">
                I enter shifts as my monthly or bi-weekly roster comes out
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
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    borderWidth: theme.sizes.selectedBorder,
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
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  radioCircle: {
    width: theme.sizes.dayNumberCircle,
    height: theme.sizes.dayNumberCircle,
    borderRadius: theme.radius.full,
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
  paletteHeader: {
    marginTop: theme.spacing.xs,
  },
  templateButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
  },
}));
