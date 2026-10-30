import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROOT_ROUTES } from '@/constants/routes';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectSettings, selectTemplates, useSettingsStore, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';
import { TemplateRow } from './components/TemplateRow';

export function TemplateListScreen({
  navigation,
}: RootStackScreenProps<typeof ROOT_ROUTES.TEMPLATE_LIST>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const templates = useTemplateStore(selectTemplates);
  const settings = useSettingsStore(selectSettings);
  const timeFormat = settings?.timeFormat ?? '24h';

  const [showArchived, setShowArchived] = useState(false);

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const archivedTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt !== null),
    [templates],
  );

  const handleUnarchive = async (templateId: string): Promise<void> => {
    haptics.success();
    await useTemplateStore.getState().unarchiveTemplate(templateId);
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
          />
          <Text variant="title" weight="semibold">
            Shift Templates
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add template"
          onPress={() => navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {})}
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          hitSlop={styles.hitSlop}
        >
          <Icon name="plus" size={16} tone="onAccent" />
          <Text variant="bodySmall" weight="semibold" tone="onAccent">
            New
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text variant="caption" tone="muted" weight="semibold">
            {`ACTIVE TEMPLATES (${activeTemplates.length})`}
          </Text>
        </View>

        {activeTemplates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodySmall" tone="muted">
              No active shift templates
            </Text>
            <Button
              label="Create First Template"
              variant="secondary"
              onPress={() => navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {})}
            />
          </View>
        ) : (
          <View style={styles.card}>
            {activeTemplates.map((template, index) => (
              <View key={template.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <TemplateRow
                  template={template}
                  timeFormat={timeFormat}
                  onPress={() =>
                    navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {
                      templateId: template.id,
                    })
                  }
                />
              </View>
            ))}
          </View>
        )}

        {archivedTemplates.length > 0 ? (
          <View style={styles.archivedSection}>
            <View style={styles.archivedToggleRow}>
              <Text variant="bodySmall" weight="semibold">
                {`Show Archived (${archivedTemplates.length})`}
              </Text>
              <Switch
                value={showArchived}
                onValueChange={setShowArchived}
                accessibilityLabel="Toggle show archived templates"
              />
            </View>

            {showArchived ? (
              <View style={styles.card}>
                {archivedTemplates.map((template, index) => (
                  <View key={template.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <TemplateRow
                      template={template}
                      timeFormat={timeFormat}
                      isArchived
                      onRestore={() => void handleUnarchive(template.id)}
                      onPress={() =>
                        navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {
                          templateId: template.id,
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default TemplateListScreen;

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  newButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  newButtonPressed: {
    opacity: 0.8,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  archivedSection: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  archivedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
}));
