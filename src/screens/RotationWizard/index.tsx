import { useMemo, useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROOT_ROUTES } from '@/constants/routes';
import { type LocalDate, type NewRotation, type Rotation, type ShiftTemplate } from '@/domain';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { ShiftPill } from '@/components/ShiftPill';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { useToday } from '@/hooks';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectRotations, selectTemplates, useRotationStore, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';
import { PatternBuilder } from './components/PatternBuilder';

export function RotationWizardScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.ROTATION_WIZARD>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const today = useToday();

  const initialRotationId = route.params?.rotationId;
  const rotations = useRotationStore(selectRotations);
  const templates = useTemplateStore(selectTemplates);

  const templatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    for (const t of templates) {
      map.set(t.id, t);
    }
    return map;
  }, [templates]);

  // If a rotationId was passed via route params, default to editing that rotation
  const [editingRotationId, setEditingRotationId] = useState<string | null>(
    initialRotationId ?? null,
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedRotation = useMemo(() => {
    if (editingRotationId === null) {
      return undefined;
    }
    return rotations.find((r) => r.id === editingRotationId);
  }, [editingRotationId, rotations]);

  const isBuilderMode = isCreatingNew || selectedRotation !== undefined;

  const handleToggleActive = async (rotation: Rotation): Promise<void> => {
    haptics.selection();
    await useRotationStore.getState().updateRotation({
      ...rotation,
      active: !rotation.active,
    });
  };

  const handleDelete = async (rotationId: string): Promise<void> => {
    haptics.warning();
    await useRotationStore.getState().deleteRotation(rotationId);
    setConfirmDeleteId(null);
  };

  const handleSavePattern = async (
    updated: NewRotation,
    effectiveFrom?: LocalDate,
  ): Promise<void> => {
    haptics.success();
    if (selectedRotation !== undefined) {
      // Editing non-destructively
      const targetEffective = effectiveFrom ?? today;
      await useRotationStore
        .getState()
        .editRotationFromDate(selectedRotation.id, updated, targetEffective);
    } else {
      // Creating brand new rotation
      await useRotationStore.getState().createRotation(updated);
    }

    if (initialRotationId !== undefined) {
      navigation.goBack();
    } else {
      setEditingRotationId(null);
      setIsCreatingNew(false);
    }
  };

  const handleCancelBuilder = (): void => {
    if (initialRotationId !== undefined) {
      navigation.goBack();
    } else {
      setEditingRotationId(null);
      setIsCreatingNew(false);
    }
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
          onPress={() => {
            if (isBuilderMode && initialRotationId === undefined) {
              setEditingRotationId(null);
              setIsCreatingNew(false);
            } else {
              navigation.goBack();
            }
          }}
        />
        <Text variant="title" weight="semibold">
          {isBuilderMode
            ? selectedRotation !== undefined
              ? 'Edit Rotation'
              : 'New Rotation'
            : 'Rotations'}
        </Text>
        {!isBuilderMode ? (
          <IconButton
            iconName="plus"
            accessibilityLabel="New rotation"
            onPress={() => setIsCreatingNew(true)}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isBuilderMode ? (
        <PatternBuilder
          today={today}
          existingRotation={selectedRotation}
          onSave={handleSavePattern}
          onCancel={handleCancelBuilder}
        />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {rotations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodySmall" tone="muted">
                No shift rotations configured yet
              </Text>
              <Button
                label="Create First Rotation"
                variant="primary"
                onPress={() => setIsCreatingNew(true)}
                accessibilityLabel="Create first rotation"
              />
            </View>
          ) : (
            rotations.map((rotation) => {
              const isConfirming = confirmDeleteId === rotation.id;

              if (isConfirming) {
                return (
                  <View key={rotation.id} style={styles.confirmBox}>
                    <Text variant="bodySmall" tone="muted">
                      {`Delete rotation "${rotation.name}"?`}
                    </Text>
                    <View style={styles.confirmActions}>
                      <TextButton
                        label="Delete"
                        tone="danger"
                        onPress={() => void handleDelete(rotation.id)}
                        accessibilityLabel={`Confirm delete ${rotation.name}`}
                      />
                      <TextButton
                        label="Cancel"
                        tone="muted"
                        onPress={() => setConfirmDeleteId(null)}
                        accessibilityLabel="Cancel delete rotation"
                      />
                    </View>
                  </View>
                );
              }

              return (
                <View key={rotation.id} style={styles.rotationCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Text variant="body" weight="semibold">
                        {rotation.name}
                      </Text>
                      <Text variant="caption" tone="muted" tabularNums>
                        {`${rotation.startDate} to ${
                          rotation.endDate ?? 'Ongoing'
                        } \u2022 ${rotation.pattern.length}-day cycle`}
                      </Text>
                    </View>
                    <Switch
                      value={rotation.active}
                      onValueChange={() => void handleToggleActive(rotation)}
                      accessibilityLabel={`Toggle active for ${rotation.name}`}
                    />
                  </View>

                  <View style={styles.previewRow}>
                    {rotation.pattern.slice(0, 10).map((entry, idx) => {
                      const template = entry !== null ? templatesById.get(entry) : undefined;

                      if (template !== undefined) {
                        return (
                          <ShiftPill
                            key={`preview-${rotation.id}-${idx}`}
                            name={template.name}
                            icon={template.icon}
                            color={template.color}
                            isOff={template.isOff}
                          />
                        );
                      }

                      return (
                        <View
                          key={`preview-blank-${rotation.id}-${idx}`}
                          style={styles.blankPreviewChip}
                        >
                          <Text variant="caption" tone="muted">
                            {'\u2014'}
                          </Text>
                        </View>
                      );
                    })}
                    {rotation.pattern.length > 10 ? (
                      <View style={styles.overflowBadge}>
                        <Text variant="caption" tone="muted">
                          {`+${rotation.pattern.length - 10}`}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardActions}>
                    <IconButton
                      iconName="edit-2"
                      tone="muted"
                      accessibilityLabel={`Edit ${rotation.name}`}
                      onPress={() => setEditingRotationId(rotation.id)}
                    />
                    <IconButton
                      iconName="trash-2"
                      tone="muted"
                      accessibilityLabel={`Delete ${rotation.name}`}
                      onPress={() => setConfirmDeleteId(rotation.id)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

export default RotationWizardScreen;

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
  headerSpacer: {
    width: theme.sizes.touchTarget,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rotationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  blankPreviewChip: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBadge: {
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
  },
  confirmBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
