import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { SHIFT_SYSTEM_PRESETS, type ShiftSystemPresetId } from '@/constants';
import { Icon } from '@/components/Icon';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface StepShiftPresetProps {
  readonly selectedPresetId: ShiftSystemPresetId;
  readonly onSelectPreset: (id: ShiftSystemPresetId) => void;
}

export function StepShiftPreset({
  selectedPresetId,
  onSelectPreset,
}: StepShiftPresetProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          What kind of shifts do you work?
        </Text>
        <Text variant="caption" tone="muted">
          Choose a starter shift system. You can customize shift hours, colors, and templates
          anytime in Settings.
        </Text>
      </View>

      <View style={styles.cardList}>
        {SHIFT_SYSTEM_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;

          return (
            <Pressable
              key={preset.id}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => onSelectPreset(preset.id)}
              accessibilityRole="button"
              accessibilityLabel={`${preset.title}, ${preset.subtitle}. ${isSelected ? 'Selected' : 'Tap to select'}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleGroup}>
                    <Text variant="body" weight="semibold">
                      {preset.title}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {preset.subtitle}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <Icon name="check" size={16} tone="onAccent" /> : null}
                  </View>
                </View>

                <Text variant="caption" tone="muted">
                  {preset.description}
                </Text>

                <View style={styles.pillRow}>
                  {preset.templates.map((tpl) => (
                    <View key={tpl.id} style={styles.pillWrapper}>
                      <ShiftPill
                        name={tpl.name}
                        icon={tpl.icon}
                        color={tpl.color}
                        isOff={tpl.isOff}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
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
  cardList: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceRaised,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardContent: {
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  pillWrapper: {
    flexShrink: 0,
  },
}));
