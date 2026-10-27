import type { ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { ShiftTemplate } from '@/domain';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';

export interface FloatingStampBarProps {
  readonly activeTemplateId: string | null;
  readonly templates: ReadonlyArray<ShiftTemplate>;
  readonly onSelectTemplate: (templateId: string) => void;
  readonly onClose: () => void;
}

/**
 * Slim floating stamp bar anchored at the bottom of the calendar for fast multi-day shift painting.
 * Allows selecting the active brush template and paints/toggles days on calendar tap.
 */
export function FloatingStampBar({
  activeTemplateId,
  templates,
  onSelectTemplate,
  onClose,
}: FloatingStampBarProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);
  const statusLabel =
    activeTemplate !== undefined
      ? `Painting: ${activeTemplate.name}`
      : 'Select a template to paint';

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text variant="caption" weight="semibold" tone="accent" numberOfLines={1}>
          {statusLabel}
        </Text>
        <TextButton
          label="Done"
          tone="accent"
          onPress={onClose}
          accessibilityLabel="Done painting shifts"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {templates.map((template) => {
          const isSelected = template.id === activeTemplateId;
          const resolvedColor = resolveShiftColor(template.color, theme.mode);
          const iconName = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

          return (
            <Pressable
              key={template.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${template.name} for painting`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectTemplate(template.id)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                  borderColor: isSelected ? resolvedColor : 'transparent',
                  borderWidth: isSelected ? theme.sizes.selectedBorder : theme.sizes.hairline,
                },
                pressed && styles.pressed,
              ]}
            >
              <Icon name={iconName} size={theme.sizes.compactIconSize} color={resolvedColor} />
              <Text variant="caption" weight="semibold" style={{ color: resolvedColor }}>
                {template.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.sizes.size1 * 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    minHeight: theme.sizes.segmentedControlHeight,
  },
  pressed: {
    opacity: 0.7,
  },
}));
