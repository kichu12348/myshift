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
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <Text
              variant="bodySmall"
              weight={isSelected ? 'semibold' : 'regular'}
              tone={isSelected ? 'accent' : 'muted'}
            >
              {option.label}
            </Text>
            {isSelected ? <View style={styles.activeIndicator} /> : null}
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
    borderBottomWidth: theme.sizes.hairline,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.touchTarget,
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.7,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: theme.sizes.underlineHeight,
    backgroundColor: theme.colors.accent,
  },
}));
