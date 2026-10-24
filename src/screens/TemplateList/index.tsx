import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROOT_ROUTES } from '@/constants/routes';
import type { ShiftTemplate } from '@/domain';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { ShiftPill } from '@/components/ShiftPill';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectTemplates, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';

export function TemplateListScreen({
  navigation,
}: RootStackScreenProps<typeof ROOT_ROUTES.TEMPLATE_LIST>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const templates = useTemplateStore(selectTemplates);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const archivedTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt !== null),
    [templates],
  );

  const handleArchive = async (templateId: string): Promise<void> => {
    haptics.warning();
    await useTemplateStore.getState().archiveTemplate(templateId);
    setConfirmArchiveId(null);
  };

  const handleUnarchive = async (templateId: string): Promise<void> => {
    haptics.success();
    await useTemplateStore.getState().unarchiveTemplate(templateId);
  };

  const renderTemplateRow = (template: ShiftTemplate, isArchived: boolean): ReactElement => {
    const isConfirming = confirmArchiveId === template.id;

    if (isConfirming) {
      return (
        <View key={template.id} style={styles.confirmBox}>
          <Text variant="bodySmall" tone="muted">
            {`Archive "${template.name}"?`}
          </Text>
          <View style={styles.confirmActions}>
            <TextButton
              label="Archive"
              tone="danger"
              onPress={() => void handleArchive(template.id)}
              accessibilityLabel={`Confirm archive ${template.name}`}
            />
            <TextButton
              label="Cancel"
              tone="muted"
              onPress={() => setConfirmArchiveId(null)}
              accessibilityLabel="Cancel archive"
            />
          </View>
        </View>
      );
    }

    return (
      <View key={template.id} style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${template.name} template`}
          onPress={() =>
            navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {
              templateId: template.id,
            })
          }
          style={styles.rowContent}
        >
          <ShiftPill
            name={template.name}
            icon={template.icon}
            color={template.color}
            isOff={template.isOff}
          />
          <View style={styles.templateMeta}>
            <Text variant="caption" tone="muted" tabularNums>
              {template.isOff ? 'Off' : `${template.startTime} \u2013 ${template.endTime}`}
            </Text>
            {!template.isOff && template.breakMinutes > 0 ? (
              <Text variant="caption" tone="muted">
                {` \u2022 ${template.breakMinutes}m break`}
              </Text>
            ) : null}
            {template.hourlyRate !== null ? (
              <Text variant="caption" tone="muted" tabularNums>
                {` \u2022 $${template.hourlyRate}/h`}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {isArchived ? (
          <TextButton
            label="Restore"
            tone="accent"
            onPress={() => void handleUnarchive(template.id)}
            accessibilityLabel={`Restore ${template.name}`}
          />
        ) : (
          <IconButton
            iconName="archive"
            tone="muted"
            accessibilityLabel={`Archive ${template.name}`}
            onPress={() => setConfirmArchiveId(template.id)}
          />
        )}
      </View>
    );
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
      <View style={styles.header}>
        <IconButton
          iconName="arrow-left"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title" weight="semibold">
          Shift Templates
        </Text>
        <IconButton
          iconName="plus"
          accessibilityLabel="Add template"
          onPress={() => navigation.navigate(ROOT_ROUTES.TEMPLATE_EDITOR, {})}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text variant="caption" tone="muted">
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
          activeTemplates.map((template) => renderTemplateRow(template, false))
        )}

        {archivedTemplates.length > 0 ? (
          <View style={styles.archivedSection}>
            <View style={styles.archivedToggleRow}>
              <Text variant="bodySmall" weight="semibold">
                Show Archived ({archivedTemplates.length})
              </Text>
              <Switch
                value={showArchived}
                onValueChange={setShowArchived}
                accessibilityLabel="Toggle show archived templates"
              />
            </View>

            {showArchived
              ? archivedTemplates.map((template) => renderTemplateRow(template, true))
              : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  rowContent: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  templateMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  confirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  archivedSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  archivedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
}));
