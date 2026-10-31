import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { ShiftTemplate } from '@/domain';
import { haptics } from '@/services';
import { makeStyles, resolveShiftColor, SHIFT_PILL_FILL_ALPHA, useTheme } from '@/theme';

export interface TemplatePaletteCardProps {
  readonly templates: readonly ShiftTemplate[];
  readonly onAppendTemplate: (templateId: string) => void;
}

export function TemplatePaletteCard({
  templates,
  onAppendTemplate,
}: TemplatePaletteCardProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold">
        TAP TO APPEND SHIFT
      </Text>
      <View style={styles.card}>
        <View style={styles.paletteGrid}>
          {templates.map((template) => {
            const resolvedColor = resolveShiftColor(template.color, theme.mode);
            const iconName = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

            return (
              <Pressable
                key={template.id}
                style={[
                  styles.templateButton,
                  {
                    backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                    borderColor: resolvedColor,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  onAppendTemplate(template.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add ${template.name} day`}
              >
                <Icon name={iconName} size={18} color={resolvedColor} />
                <Text variant="bodySmall" weight="semibold" style={{ color: resolvedColor }}>
                  {`${template.name}`}
                </Text>
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
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  templateButton: {
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
}));
