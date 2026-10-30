import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { SHIFT_ICONS, type ShiftIconName } from '@/constants';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import {
  SHIFT_PILL_FILL_ALPHA,
  makeStyles,
  resolveShiftColor,
  shiftColorPresets,
  useTheme,
} from '@/theme';

export interface TemplateAppearancePickerProps {
  readonly selectedColor: string;
  readonly onSelectColor: (color: string) => void;
  readonly selectedIcon: ShiftIconName;
  readonly onSelectIcon: (icon: ShiftIconName) => void;
}

export function TemplateAppearancePicker({
  selectedColor,
  onSelectColor,
  selectedIcon,
  onSelectIcon,
}: TemplateAppearancePickerProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const resolvedColor = resolveShiftColor(selectedColor, theme.mode);

  const handleSelectColor = (color: string): void => {
    haptics.selection();
    onSelectColor(color);
  };

  const handleSelectIcon = (icon: ShiftIconName): void => {
    haptics.selection();
    onSelectIcon(icon);
  };

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        COLOR &amp; ICON
      </Text>

      <View style={styles.card}>
        <View style={styles.swatchesContainer}>
          {shiftColorPresets.map((preset) => {
            const presetColor = theme.mode === 'dark' ? preset.dark : preset.light;
            const isSelected =
              selectedColor.toLowerCase() === preset.light.toLowerCase() ||
              selectedColor.toLowerCase() === preset.dark.toLowerCase();

            return (
              <Pressable
                key={preset.name}
                accessibilityRole="button"
                accessibilityLabel={`${preset.name} color`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectColor(preset.light)}
                style={[styles.colorSwatch, { backgroundColor: presetColor }]}
                hitSlop={styles.hitSlop}
              >
                {isSelected ? <Icon name="check" size={16} tone="onAccent" /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        <View style={styles.iconsGrid}>
          {SHIFT_ICONS.map((iconName) => {
            const isSelected = selectedIcon === iconName;

            return (
              <Pressable
                key={iconName}
                accessibilityRole="button"
                accessibilityLabel={`${iconName} icon`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectIcon(iconName)}
                style={[
                  styles.iconOption,
                  isSelected && {
                    backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                    borderWidth: theme.sizes.selectedBorder,
                    borderColor: resolvedColor,
                  },
                ]}
              >
                <Icon
                  name={iconName}
                  size={20}
                  color={isSelected ? resolvedColor : undefined}
                  tone={isSelected ? undefined : 'muted'}
                />
              </Pressable>
            );
          })}
        </View>
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
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  swatchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: theme.sizes.colorSwatchSize,
    height: theme.sizes.colorSwatchSize,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  iconOption: {
    width: theme.sizes.iconOptionSize,
    height: theme.sizes.iconOptionSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

