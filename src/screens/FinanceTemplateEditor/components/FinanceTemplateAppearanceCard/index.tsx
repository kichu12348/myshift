import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles, resolveShiftColor, shiftColorPresets, useTheme } from '@/theme';

export interface FinanceTemplateAppearanceCardProps {
  readonly color: string;
  readonly onChangeColor: (color: string) => void;
  readonly icon: string;
  readonly onChangeIcon: (icon: string) => void;
}

const FEATHER_ICONS: readonly IconName[] = [
  'home',
  'percent',
  'tag',
  'zap',
  'credit-card',
  'shopping-bag',
  'wifi',
  'heart',
  'shield',
  'briefcase',
  'send',
  'more-horizontal',
  'coffee',
  'truck',
  'gift',
  'archive',
];

export function FinanceTemplateAppearanceCard({
  color,
  onChangeColor,
  icon,
  onChangeIcon,
}: FinanceTemplateAppearanceCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const resolvedColor = resolveShiftColor(color, theme.mode);

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" weight="semibold">
        Appearance
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle color and icon picker"
        onPress={() => {
          haptics.selection();
          setIsExpanded((prev) => !prev);
        }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        hitSlop={styles.hitSlop}
      >
        <View style={styles.cardLeft}>
          <Icon name={icon as IconName} size={18} tone="muted" />
          <Text variant="body">Icon & Color</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.colorDot, { backgroundColor: resolvedColor }]} />
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size={16}
            tone="muted"
          />
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.expandedContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {shiftColorPresets.map((preset) => {
              const isSelected = preset.light.toLowerCase() === color.toLowerCase();
              const swatchBg = resolveShiftColor(preset.light, theme.mode);
              return (
                <Pressable
                  key={preset.name}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${preset.name}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    haptics.selection();
                    onChangeColor(preset.light);
                  }}
                  style={[styles.swatchTouch, isSelected && styles.swatchSelected]}
                  hitSlop={styles.hitSlop}
                >
                  <View style={[styles.swatchCircle, { backgroundColor: swatchBg }]}>
                    {isSelected ? <Icon name="check" size={16} tone="onAccent" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {FEATHER_ICONS.map((ic) => {
              const isSelected = ic === icon;
              return (
                <Pressable
                  key={ic}
                  accessibilityRole="button"
                  accessibilityLabel={`Icon ${ic}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    haptics.selection();
                    onChangeIcon(ic);
                  }}
                  style={[styles.iconButton, isSelected && styles.iconButtonSelected]}
                  hitSlop={styles.hitSlop}
                >
                  <Icon name={ic} size={18} tone={isSelected ? 'accent' : 'muted'} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.sizes.touchTarget,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  colorDot: {
    width: theme.sizes.colorDotPreviewSize,
    height: theme.sizes.colorDotPreviewSize,
    borderRadius: theme.radius.full,
  },
  expandedContainer: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  row: {
    gap: theme.spacing.xs,
  },
  swatchTouch: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  swatchSelected: {
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
  },
  swatchCircle: {
    width: theme.sizes.colorSwatchSize,
    height: theme.sizes.colorSwatchSize,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: theme.sizes.iconOptionSize,
    height: theme.sizes.iconOptionSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  iconButtonSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));

