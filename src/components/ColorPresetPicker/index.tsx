import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { makeStyles, resolveShiftColor, shiftColorPresets, useTheme } from '@/theme';

export interface ColorPresetPickerProps {
  readonly selectedColor: string;
  readonly onSelectColor: (color: string) => void;
}

/**
 * Color picker for the 9 curated shift color presets.
 * Stores the light preset hex while resolving the soft dark variant in dark mode.
 */
export function ColorPresetPicker({
  selectedColor,
  onSelectColor,
}: ColorPresetPickerProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const normalizedSelected = selectedColor.toLowerCase();

  return (
    <View style={styles.grid}>
      {shiftColorPresets.map((preset) => {
        const isSelected = preset.light.toLowerCase() === normalizedSelected;
        const swatchColor = resolveShiftColor(preset.light, theme.mode);

        return (
          <Pressable
            key={preset.name}
            accessibilityRole="button"
            accessibilityLabel={`Color ${preset.name}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectColor(preset.light)}
            style={[styles.touchTarget, isSelected && styles.touchTargetSelected]}
          >
            <View style={[styles.swatch, { backgroundColor: swatchColor }]}>
              {isSelected ? <Icon name="check" size={16} tone="onAccent" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  touchTarget: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.sizes.selectedBorder,
    borderColor: 'transparent',
  },
  touchTargetSelected: {
    borderColor: theme.colors.accent,
  },
  swatch: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
