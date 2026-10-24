import { useMemo, useState, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  compareLocalDates,
  isLocalDate,
  type LocalDate,
  type NewRotation,
  type Rotation,
  type RotationPatternEntry,
  type ShiftTemplate,
} from '@/domain';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { haptics } from '@/services';
import { selectTemplates, useTemplateStore } from '@/store';
import { makeStyles, useTheme } from '@/theme';

export interface PatternBuilderProps {
  readonly today: LocalDate;
  readonly existingRotation?: Rotation | undefined;
  readonly onSave: (rotation: NewRotation, effectiveFrom?: LocalDate) => Promise<void>;
  readonly onCancel: () => void;
}

interface PatternErrors {
  readonly name?: string | undefined;
  readonly startDate?: string | undefined;
  readonly anchorDate?: string | undefined;
  readonly endDate?: string | undefined;
  readonly effectiveFrom?: string | undefined;
  readonly pattern?: string | undefined;
}

/**
 * Interactive rotation pattern builder and editor.
 */
export function PatternBuilder({
  today,
  existingRotation,
  onSave,
  onCancel,
}: PatternBuilderProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const isEditing = existingRotation !== undefined;

  const [name, setName] = useState(existingRotation?.name ?? '');
  const [startDate, setStartDate] = useState<string>(existingRotation?.startDate ?? today);
  const [anchorDate, setAnchorDate] = useState<string>(existingRotation?.anchorDate ?? today);
  const [endDate, setEndDate] = useState<string>(existingRotation?.endDate ?? '');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(today);
  const [pattern, setPattern] = useState<readonly RotationPatternEntry[]>(
    existingRotation?.pattern ?? [],
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const [errors, setErrors] = useState<PatternErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = useTemplateStore(selectTemplates);
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const templatesById = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    for (const t of templates) {
      map.set(t.id, t);
    }
    return map;
  }, [templates]);

  // Dynamic nursing pattern presets based on available templates
  const presets = useMemo(() => {
    const dayTemplate =
      activeTemplates.find((t) => !t.isOff && t.name.toLowerCase().includes('day')) ??
      activeTemplates.find((t) => !t.isOff);

    const nightTemplate = activeTemplates.find(
      (t) => !t.isOff && t.name.toLowerCase().includes('night'),
    );

    const offTemplate = activeTemplates.find((t) => t.isOff);

    const list: Array<{
      readonly label: string;
      readonly build: () => RotationPatternEntry[];
    }> = [];

    if (dayTemplate !== undefined && offTemplate !== undefined) {
      list.push({
        label: '4 On / 4 Off',
        build: () => [
          dayTemplate.id,
          dayTemplate.id,
          dayTemplate.id,
          dayTemplate.id,
          offTemplate.id,
          offTemplate.id,
          offTemplate.id,
          offTemplate.id,
        ],
      });
    }

    if (dayTemplate !== undefined && nightTemplate !== undefined && offTemplate !== undefined) {
      list.push({
        label: '2 Day / 2 Night / 4 Off',
        build: () => [
          dayTemplate.id,
          dayTemplate.id,
          nightTemplate.id,
          nightTemplate.id,
          offTemplate.id,
          offTemplate.id,
          offTemplate.id,
          offTemplate.id,
        ],
      });
    }

    if (dayTemplate !== undefined && offTemplate !== undefined) {
      list.push({
        label: '5 On / 2 Off',
        build: () => [
          dayTemplate.id,
          dayTemplate.id,
          dayTemplate.id,
          dayTemplate.id,
          dayTemplate.id,
          offTemplate.id,
          offTemplate.id,
        ],
      });
    }

    return list;
  }, [activeTemplates]);

  const handleSlotAction = (entry: RotationPatternEntry): void => {
    haptics.selection();
    if (selectedSlotIndex !== null && selectedSlotIndex < pattern.length) {
      // Replace selected slot
      const next = [...pattern];
      next[selectedSlotIndex] = entry;
      setPattern(next);
      setSelectedSlotIndex(null);
    } else {
      // Append to cycle
      setPattern((prev) => [...prev, entry]);
    }
  };

  const handleRemoveSlot = (index: number): void => {
    haptics.selection();
    setPattern((prev) => prev.filter((_, i) => i !== index));
    if (selectedSlotIndex === index) {
      setSelectedSlotIndex(null);
    } else if (selectedSlotIndex !== null && selectedSlotIndex > index) {
      setSelectedSlotIndex(selectedSlotIndex - 1);
    }
  };

  const validate = (): boolean => {
    const newErrors: PatternErrors = {
      ...(name.trim() ? {} : { name: 'Rotation name is required' }),
      ...(pattern.length > 0 ? {} : { pattern: 'Cycle must have at least 1 day' }),
      ...(isLocalDate(startDate) ? {} : { startDate: 'Start date must be YYYY-MM-DD' }),
      ...(isLocalDate(anchorDate) ? {} : { anchorDate: 'Anchor date must be YYYY-MM-DD' }),
      ...(endDate.trim().length > 0 && !isLocalDate(endDate)
        ? { endDate: 'End date must be YYYY-MM-DD' }
        : {}),
      ...(endDate.trim().length > 0 &&
      isLocalDate(endDate) &&
      isLocalDate(startDate) &&
      compareLocalDates(endDate, startDate) < 0
        ? { endDate: 'End date cannot be before start date' }
        : {}),
      ...(isEditing && !isLocalDate(effectiveFrom)
        ? { effectiveFrom: 'Effective date must be YYYY-MM-DD' }
        : {}),
    };

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newRotation: NewRotation = {
        name: name.trim(),
        anchorDate: anchorDate as LocalDate,
        pattern: [...pattern],
        startDate: startDate as LocalDate,
        endDate: endDate.trim().length > 0 ? (endDate as LocalDate) : null,
        active: existingRotation?.active ?? true,
      };

      await onSave(newRotation, isEditing ? (effectiveFrom as LocalDate) : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
            Rotation Name
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="e.g. 4 On / 4 Off, Weekend Night Shift"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, errors.name !== undefined && styles.inputError]}
            accessibilityLabel="Rotation name"
          />
          {errors.name !== undefined ? (
            <Text variant="caption" tone="danger" style={styles.errorText}>
              {errors.name}
            </Text>
          ) : null}
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Start Date
            </Text>
            <TextInput
              value={startDate}
              onChangeText={(text) => {
                setStartDate(text);
                if (errors.startDate) {
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, errors.startDate !== undefined && styles.inputError]}
              accessibilityLabel="Rotation start date"
              autoCapitalize="none"
            />
            {errors.startDate !== undefined ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {errors.startDate}
              </Text>
            ) : null}
          </View>

          <View style={styles.dateCol}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Anchor Date
            </Text>
            <TextInput
              value={anchorDate}
              onChangeText={(text) => {
                setAnchorDate(text);
                if (errors.anchorDate) {
                  setErrors((prev) => ({ ...prev, anchorDate: undefined }));
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, errors.anchorDate !== undefined && styles.inputError]}
              accessibilityLabel="Rotation anchor date"
              autoCapitalize="none"
            />
            {errors.anchorDate !== undefined ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {errors.anchorDate}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
            End Date (optional)
          </Text>
          <TextInput
            value={endDate}
            onChangeText={(text) => {
              setEndDate(text);
              if (errors.endDate) {
                setErrors((prev) => ({ ...prev, endDate: undefined }));
              }
            }}
            placeholder="Leave empty for ongoing rotation"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, errors.endDate !== undefined && styles.inputError]}
            accessibilityLabel="Rotation end date"
            autoCapitalize="none"
          />
          {errors.endDate !== undefined ? (
            <Text variant="caption" tone="danger" style={styles.errorText}>
              {errors.endDate}
            </Text>
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.effectiveSection}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Effective From Date
            </Text>
            <TextInput
              value={effectiveFrom}
              onChangeText={(text) => {
                setEffectiveFrom(text);
                if (errors.effectiveFrom) {
                  setErrors((prev) => ({ ...prev, effectiveFrom: undefined }));
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, errors.effectiveFrom !== undefined && styles.inputError]}
              accessibilityLabel="Effective from date"
              autoCapitalize="none"
            />
            <Text variant="caption" tone="muted" style={styles.effectiveNotice}>
              Dates before this effective date remain untouched in calendar history.
            </Text>
            {errors.effectiveFrom !== undefined ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {errors.effectiveFrom}
              </Text>
            ) : null}
          </View>
        ) : null}

        {presets.length > 0 && pattern.length === 0 ? (
          <View style={styles.section}>
            <Text variant="caption" tone="muted" style={styles.fieldLabel}>
              Quick Presets
            </Text>
            <View style={styles.presetsRow}>
              {presets.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  iconName="repeat"
                  onPress={() => {
                    haptics.selection();
                    setPattern(preset.build());
                  }}
                  accessibilityLabel={`Apply preset ${preset.label}`}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.patternHeaderRow}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              {`Cycle Pattern (${pattern.length} days)`}
            </Text>
            {pattern.length > 0 ? (
              <TextButton
                label="Clear All"
                tone="danger"
                onPress={() => {
                  haptics.warning();
                  setPattern([]);
                  setSelectedSlotIndex(null);
                }}
                accessibilityLabel="Clear rotation cycle pattern"
              />
            ) : null}
          </View>

          {errors.pattern !== undefined ? (
            <Text variant="caption" tone="danger" style={styles.errorText}>
              {errors.pattern}
            </Text>
          ) : null}

          {pattern.length === 0 ? (
            <View style={styles.emptyPatternBox}>
              <Text variant="bodySmall" tone="muted">
                Tap templates below to add days to the sequence
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slotsRow}
            >
              {pattern.map((entry, index) => {
                const isSelected = selectedSlotIndex === index;
                const template = entry !== null ? templatesById.get(entry) : undefined;

                return (
                  <View
                    key={`slot-${index}`}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                  >
                    <View style={styles.slotHeader}>
                      <Text variant="caption" tone="muted">
                        {`Day ${index + 1}`}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveSlot(index)}
                        hitSlop={styles.slotRemoveHitSlop}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove Day ${index + 1}`}
                      >
                        <Icon name="x" size={16} tone="muted" />
                      </Pressable>
                    </View>

                    <Pressable
                      style={styles.slotContent}
                      onPress={() => {
                        haptics.selection();
                        setSelectedSlotIndex(isSelected ? null : index);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select Day ${index + 1} to replace`}
                    >
                      {template !== undefined ? (
                        <ShiftPill
                          name={template.name}
                          icon={template.icon}
                          color={template.color}
                          isOff={template.isOff}
                        />
                      ) : (
                        <View style={styles.blankSlot}>
                          <Text variant="caption" tone="muted">
                            Blank
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
            {selectedSlotIndex !== null
              ? `Replace Day ${selectedSlotIndex + 1} with:`
              : 'Add Day to Sequence:'}
          </Text>

          <View style={styles.chipsPalette}>
            {activeTemplates.map((template) => (
              <Chip
                key={template.id}
                label={template.name}
                color={template.color}
                iconName={isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON}
                onPress={() => handleSlotAction(template.id)}
                accessibilityLabel={`Add ${template.name} day`}
              />
            ))}
            <Chip
              label="Blank (No shift)"
              iconName="minus"
              onPress={() => handleSlotAction(null)}
              accessibilityLabel="Add Blank day"
            />
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            label={isEditing ? 'Save Changes' : 'Create Rotation'}
            variant="primary"
            disabled={isSubmitting}
            onPress={() => void handleSave()}
          />
          <Button
            label="Cancel"
            variant="secondary"
            disabled={isSubmitting}
            onPress={onCancel}
            accessibilityLabel="Cancel rotation editing"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((theme) => ({
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.xs,
  },
  effectiveSection: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  effectiveNotice: {
    paddingHorizontal: theme.spacing.xs,
  },
  fieldLabel: {
    paddingHorizontal: theme.spacing.xs,
  },
  datesRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dateCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  input: {
    minHeight: theme.sizes.touchTarget,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.size.body,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    paddingHorizontal: theme.spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  patternHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  emptyPatternBox: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  slotCard: {
    width: theme.sizes.slotCardWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  slotCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  slotHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotRemoveHitSlop: {
    top: theme.spacing.md,
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  slotContent: {
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankSlot: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  actionsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
}));
