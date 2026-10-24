import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import type { CalendarViewMode } from '@/domain';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface ViewModeToggleProps {
  readonly mode: CalendarViewMode;
  readonly onChange: (mode: CalendarViewMode) => void;
}

interface ModeOption {
  readonly key: CalendarViewMode;
  readonly label: string;
}

const MODE_OPTIONS: ReadonlyArray<ModeOption> = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
];

/**
 * Quiet segmented control switching calendar view modes between Month, Week, and Day.
 */
export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps): ReactElement {
  const styles = useStyles();

  const handlePress = (targetMode: CalendarViewMode): void => {
    if (targetMode !== mode) {
      haptics.selection();
      onChange(targetMode);
    }
  };

  return (
    <View style={styles.container} accessibilityRole="toolbar">
      {MODE_OPTIONS.map((option) => {
        const isSelected = option.key === mode;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} view`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => handlePress(option.key)}
            style={({ pressed }) => [
              styles.segment,
              isSelected ? styles.segmentSelected : styles.segmentUnselected,
              pressed && styles.segmentPressed,
            ]}
          >
            <Text
              variant="bodySmall"
              weight={isSelected ? 'semibold' : 'regular'}
              style={isSelected ? styles.textSelected : styles.textUnselected}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  segmentSelected: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  segmentUnselected: {
    backgroundColor: 'transparent',
  },
  segmentPressed: {
    opacity: 0.7,
  },
  textSelected: {
    color: theme.colors.accent,
  },
  textUnselected: {
    color: theme.colors.textMuted,
  },
}));
