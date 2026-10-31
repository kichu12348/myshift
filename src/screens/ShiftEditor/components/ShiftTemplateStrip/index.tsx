import type { ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { ShiftTemplate } from '@/domain';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';

export interface ShiftTemplateStripProps {
  readonly templates: readonly ShiftTemplate[];
  readonly selectedTemplateId: string | null;
  readonly onSelectTemplate: (template: ShiftTemplate) => void;
}

export function ShiftTemplateStrip({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}: ShiftTemplateStripProps): ReactElement {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionHeader}>
        QUICK-FILL FROM TEMPLATE
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const icon = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

          return (
            <Chip
              key={template.id}
              label={template.name}
              color={template.color}
              iconName={icon}
              selected={isSelected}
              onPress={() => onSelectTemplate(template)}
              accessibilityLabel={`Apply ${template.name} template`}
            />
          );
        })}
      </ScrollView>
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
  scrollContent: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
}));

