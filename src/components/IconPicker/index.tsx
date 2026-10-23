import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { SHIFT_ICONS, type ShiftIconName } from '@/constants';
import { Icon } from '@/components/Icon';
import { makeStyles } from '@/theme';

export interface IconPickerProps {
  readonly selectedIcon: ShiftIconName;
  readonly onSelectIcon: (icon: ShiftIconName) => void;
}

/**
 * Grid selector for the 16 curated shift icons.
 * Highlights the chosen icon with dusty rose accent border and soft fill.
 */
export function IconPicker({
  selectedIcon,
  onSelectIcon,
}: IconPickerProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.grid}>
      {SHIFT_ICONS.map((icon) => {
        const isSelected = icon === selectedIcon;
        return (
          <Pressable
            key={icon}
            accessibilityRole="button"
            accessibilityLabel={`Icon ${icon}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectIcon(icon)}
            style={[
              styles.item,
              isSelected ? styles.itemSelected : styles.itemDefault,
            ]}
          >
            <Icon
              name={icon}
              size={20}
              tone={isSelected ? 'accent' : 'text'}
            />
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
  item: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.selectedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDefault: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  itemSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
}));
