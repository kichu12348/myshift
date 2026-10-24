import { useMemo, useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SHIFT_ICON, isShiftIconName, type ShiftIconName } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { epochToTimeOfDay, isTimeOfDay, type ShiftTemplate, type TimeOfDay } from '@/domain';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ColorPresetPicker } from '@/components/ColorPresetPicker';
import { IconButton } from '@/components/IconButton';
import { IconPicker } from '@/components/IconPicker';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectTemplates, useRotationStore, useShiftStore, useTemplateStore } from '@/store';
import { makeStyles, useTheme } from '@/theme';
import { formatLongDate } from '@/utils';

interface ShiftFormErrors {
  readonly name?: string | undefined;
  readonly startTime?: string | undefined;
  readonly endTime?: string | undefined;
  readonly breakMinutes?: string | undefined;
}

export function ShiftEditorScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.SHIFT_EDITOR>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { theme } = useTheme();

  const { date, shift } = route.params;
  const isEditing = shift !== undefined;

  const initialIcon: ShiftIconName =
    shift !== undefined && isShiftIconName(shift.icon) ? shift.icon : DEFAULT_SHIFT_ICON;

  const initialStart: string =
    shift !== undefined && !shift.isOff ? epochToTimeOfDay(shift.startsAt) : '07:00';

  const initialEnd: string =
    shift !== undefined && !shift.isOff ? epochToTimeOfDay(shift.endsAt) : '15:00';

  const [name, setName] = useState(shift?.name ?? '');
  const [templateId, setTemplateId] = useState<string | null>(shift?.templateId ?? null);
  const [isOff, setIsOff] = useState(shift?.isOff ?? false);
  const [icon, setIcon] = useState<ShiftIconName>(initialIcon);
  const [color, setColor] = useState(shift?.color ?? '#F59E0B');
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [breakMinutes, setBreakMinutes] = useState(
    shift !== undefined ? String(shift.breakMinutes) : '30',
  );
  const [notes, setNotes] = useState(shift?.notes ?? '');

  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = useTemplateStore(selectTemplates);
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const handleApplyTemplate = (template: ShiftTemplate): void => {
    haptics.selection();
    setName(template.name);
    setTemplateId(template.id);
    setIsOff(template.isOff);
    if (isShiftIconName(template.icon)) {
      setIcon(template.icon);
    }
    setColor(template.color);
    setStartTime(template.startTime);
    setEndTime(template.endTime);
    setBreakMinutes(String(template.breakMinutes));
  };

  const validate = (): boolean => {
    const newErrors: ShiftFormErrors = {
      ...(name.trim() ? {} : { name: 'Shift name is required' }),
      ...(!isOff && !isTimeOfDay(startTime)
        ? { startTime: 'Start time must be in HH:mm format (e.g. 07:00)' }
        : {}),
      ...(!isOff && !isTimeOfDay(endTime)
        ? { endTime: 'End time must be in HH:mm format (e.g. 15:00)' }
        : {}),
      ...(!isOff &&
      (!Number.isInteger(Number(breakMinutes)) ||
        Number(breakMinutes) < 0 ||
        breakMinutes.trim().length === 0)
        ? { breakMinutes: 'Break minutes must be a positive integer or 0' }
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
      const validStartTime: TimeOfDay = isOff ? '00:00' : (startTime as TimeOfDay);
      const validEndTime: TimeOfDay = isOff ? '00:00' : (endTime as TimeOfDay);
      const validBreak = isOff ? 0 : Number(breakMinutes);

      if (shift !== undefined) {
        if (shift.origin === 'rotation') {
          // Virtual shift converted into a stored rotation override
          await useShiftStore.getState().createShift({
            date,
            templateId,
            name: name.trim(),
            icon,
            color,
            isOff,
            startTime: validStartTime,
            endTime: validEndTime,
            breakMinutes: validBreak,
            notes: notes.trim(),
            source: 'rotation_override',
            rotationId: shift.rotationId,
            reminderOverride: null,
          });
        } else {
          // Existing manual or rotation_override shift
          await useShiftStore.getState().updateShift(shift.id, {
            date,
            templateId,
            name: name.trim(),
            icon,
            color,
            isOff,
            startTime: validStartTime,
            endTime: validEndTime,
            breakMinutes: validBreak,
            notes: notes.trim(),
            source: shift.origin === 'rotation_override' ? 'rotation_override' : 'manual',
            rotationId: shift.rotationId,
            reminderOverride: null,
          });
        }
      } else {
        // Brand new shift
        await useShiftStore.getState().createShift({
          date,
          templateId,
          name: name.trim(),
          icon,
          color,
          isOff,
          startTime: validStartTime,
          endTime: validEndTime,
          breakMinutes: validBreak,
          notes: notes.trim(),
          source: 'manual',
          rotationId: null,
          reminderOverride: null,
        });
      }

      haptics.success();
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (shift === undefined) {
      return;
    }

    setIsSubmitting(true);
    try {
      haptics.warning();
      if (shift.origin === 'rotation') {
        if (shift.rotationId !== null) {
          await useRotationStore.getState().upsertException({
            rotationId: shift.rotationId,
            date: shift.date,
            kind: 'skip',
            templateId: null,
          });
        }
      } else {
        await useShiftStore.getState().deleteShift(shift.id);
      }
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
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
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerTitleContainer}>
          <Text variant="title" weight="semibold">
            {isEditing ? 'Edit Shift' : 'New Shift'}
          </Text>
          <Text variant="caption" tone="muted">
            {formatLongDate(date)}
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTemplates.length > 0 && !isEditing ? (
            <View style={styles.section}>
              <Text variant="caption" tone="muted" style={styles.sectionTitle}>
                Quick-Fill from Template
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templateChipsRow}
              >
                {activeTemplates.map((template) => (
                  <Chip
                    key={template.id}
                    label={template.name}
                    color={template.color}
                    iconName={isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON}
                    onPress={() => handleApplyTemplate(template)}
                    accessibilityLabel={`Apply ${template.name} template`}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Shift Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="e.g. Day Shift, Night Shift"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, errors.name !== undefined && styles.inputError]}
              accessibilityLabel="Shift name"
            />
            {errors.name !== undefined ? (
              <Text variant="caption" tone="danger" style={styles.errorText}>
                {errors.name}
              </Text>
            ) : null}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text variant="bodySmall" weight="semibold">
                Off Day
              </Text>
              <Text variant="caption" tone="muted">
                Mark as scheduled time off
              </Text>
            </View>
            <Switch value={isOff} onValueChange={setIsOff} accessibilityLabel="Off shift toggle" />
          </View>

          {!isOff ? (
            <View style={styles.timesContainer}>
              <View style={styles.timeColumn}>
                <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
                  Start Time
                </Text>
                <TextInput
                  value={startTime}
                  onChangeText={(text) => {
                    setStartTime(text);
                    if (errors.startTime) {
                      setErrors((prev) => ({ ...prev, startTime: undefined }));
                    }
                  }}
                  placeholder="07:00"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, errors.startTime !== undefined && styles.inputError]}
                  accessibilityLabel="Start time"
                  autoCapitalize="none"
                />
                {errors.startTime !== undefined ? (
                  <Text variant="caption" tone="danger" style={styles.errorText}>
                    {errors.startTime}
                  </Text>
                ) : null}
              </View>

              <View style={styles.timeColumn}>
                <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
                  End Time
                </Text>
                <TextInput
                  value={endTime}
                  onChangeText={(text) => {
                    setEndTime(text);
                    if (errors.endTime) {
                      setErrors((prev) => ({ ...prev, endTime: undefined }));
                    }
                  }}
                  placeholder="15:00"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, errors.endTime !== undefined && styles.inputError]}
                  accessibilityLabel="End time"
                  autoCapitalize="none"
                />
                {errors.endTime !== undefined ? (
                  <Text variant="caption" tone="danger" style={styles.errorText}>
                    {errors.endTime}
                  </Text>
                ) : null}
              </View>

              <View style={styles.timeColumn}>
                <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
                  Break (mins)
                </Text>
                <TextInput
                  value={breakMinutes}
                  onChangeText={(text) => {
                    setBreakMinutes(text);
                    if (errors.breakMinutes) {
                      setErrors((prev) => ({ ...prev, breakMinutes: undefined }));
                    }
                  }}
                  placeholder="30"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.input, errors.breakMinutes !== undefined && styles.inputError]}
                  accessibilityLabel="Break minutes"
                />
                {errors.breakMinutes !== undefined ? (
                  <Text variant="caption" tone="danger" style={styles.errorText}>
                    {errors.breakMinutes}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Icon
            </Text>
            <IconPicker selectedIcon={icon} onSelectIcon={setIcon} />
          </View>

          <View style={styles.section}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Color
            </Text>
            <ColorPresetPicker selectedColor={color} onSelectColor={setColor} />
          </View>

          <View style={styles.section}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add optional notes or assignment details"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
              accessibilityLabel="Shift notes"
            />
          </View>

          <View style={styles.actionsContainer}>
            <Button
              label={isEditing ? 'Save Changes' : 'Create Shift'}
              variant="primary"
              disabled={isSubmitting}
              onPress={() => void handleSave()}
            />

            {isEditing ? (
              isConfirmingDelete ? (
                <View style={styles.deleteConfirmBox}>
                  <Text variant="bodySmall" tone="muted" style={styles.deletePromptText}>
                    {shift.origin === 'rotation'
                      ? 'Remove rotation shift on this day?'
                      : 'Delete this shift completely?'}
                  </Text>
                  <View style={styles.deleteActions}>
                    <Button
                      label="Confirm Delete"
                      variant="danger"
                      disabled={isSubmitting}
                      onPress={() => void handleDelete()}
                      accessibilityLabel="Confirm delete shift"
                    />
                    <Button
                      label="Cancel"
                      variant="secondary"
                      disabled={isSubmitting}
                      onPress={() => setIsConfirmingDelete(false)}
                      accessibilityLabel="Cancel delete shift"
                    />
                  </View>
                </View>
              ) : (
                <Button
                  label="Delete Shift"
                  variant="danger"
                  disabled={isSubmitting}
                  onPress={() => setIsConfirmingDelete(true)}
                  accessibilityLabel="Delete shift"
                />
              )
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default ShiftEditorScreen;

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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerRightSpacer: {
    width: theme.sizes.touchTarget,
  },
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
  sectionTitle: {
    paddingHorizontal: theme.spacing.xs,
  },
  fieldLabel: {
    paddingHorizontal: theme.spacing.xs,
  },
  templateChipsRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
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
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  errorText: {
    paddingHorizontal: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  switchLabelContainer: {
    gap: theme.spacing.xs,
  },
  timesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeColumn: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actionsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  deleteConfirmBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  deletePromptText: {
    textAlign: 'center',
  },
  deleteActions: {
    gap: theme.spacing.xs,
  },
}));
