import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { ROOT_ROUTES } from '@/constants/routes';
import { compareLocalDates, type LocalDate, type RotationPatternEntry } from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectRotations, selectTemplates, useRotationStore, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';
import { CycleSequenceCard } from './components/CycleSequenceCard';
import { RotationDetailsCard } from './components/RotationDetailsCard';
import { RotationHeader } from './components/RotationHeader';
import { StopRotationCard } from './components/StopRotationCard';
import { TemplatePaletteCard } from './components/TemplatePaletteCard';

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

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const templatesById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  const existingRotation = useMemo(() => {
    if (initialRotationId !== undefined) {
      return rotations.find((r) => r.id === initialRotationId);
    }
    return rotations.find((r) => r.active) ?? rotations[0];
  }, [initialRotationId, rotations]);

  const isEditingExisting = existingRotation !== undefined;

  const [name, setName] = useState(existingRotation?.name ?? '');
  const [startDate, setStartDate] = useState<LocalDate>(today);
  const [endDate, setEndDate] = useState<LocalDate | null>(existingRotation?.endDate ?? null);
  const [pattern, setPattern] = useState<readonly RotationPatternEntry[]>(
    existingRotation?.pattern ?? [],
  );
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) {
      setFormError('Pattern name is required');
      return;
    }
    if (pattern.length === 0) return;
    if (endDate !== null && compareLocalDates(endDate, startDate) < 0) {
      setFormError('End date cannot be before start date');
      return;
    }

    setIsSaving(true);
    try {
      haptics.success();
      if (existingRotation !== undefined) {
        await useRotationStore.getState().editRotationFromDate(
          existingRotation.id,
          {
            name: name.trim(),
            anchorDate: startDate,
            pattern: [...pattern],
            startDate: existingRotation.startDate,
            endDate,
            active: true,
          },
          startDate,
        );
      } else {
        await useRotationStore.getState().createRotation({
          name: name.trim(),
          anchorDate: startDate,
          pattern: [...pattern],
          startDate,
          endDate,
          active: true,
        });
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStop = async (): Promise<void> => {
    if (existingRotation !== undefined) {
      await useRotationStore.getState().deleteRotation(existingRotation.id);
      navigation.goBack();
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
      <RotationHeader
        onGoBack={() => navigation.goBack()}
        existingRotation={existingRotation}
        onClearPattern={() => {
          haptics.warning();
          setPattern([]);
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <RotationDetailsCard
          name={name}
          onChangeName={(val) => {
            setName(val);
            if (formError !== undefined) {
              setFormError(undefined);
            }
          }}
          startDate={startDate}
          onChangeStartDate={(val) => {
            setStartDate(val);
            if (formError !== undefined) {
              setFormError(undefined);
            }
          }}
          endDate={endDate}
          onChangeEndDate={(val) => {
            setEndDate(val);
            if (formError !== undefined) {
              setFormError(undefined);
            }
          }}
          isEditingExisting={isEditingExisting}
          today={today}
          error={formError}
        />

        <CycleSequenceCard
          pattern={pattern}
          templatesById={templatesById}
          onRemoveSlot={(index) => setPattern((prev) => prev.filter((_, i) => i !== index))}
          onRemoveLast={() => setPattern((prev) => prev.slice(0, -1))}
          onClearAll={() => setPattern([])}
        />

        <TemplatePaletteCard
          templates={activeTemplates}
          onAppendTemplate={(templateId) => setPattern((prev) => [...prev, templateId])}
        />

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
          onPress={() => void handleSave()}
          accessibilityRole="button"
          accessibilityLabel="Save Rotation"
        >
          <Text variant="body" weight="semibold" tone="onAccent">
            Save Rotation
          </Text>
        </Pressable>

        {isEditingExisting ? <StopRotationCard onStop={() => void handleStop()} /> : null}
      </ScrollView>
    </View>
  );
}

export default RotationWizardScreen;

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
}));
