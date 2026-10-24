import { useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SHIFT_ICON, isShiftIconName, type ShiftIconName } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { isTimeOfDay, type TimeOfDay } from '@/domain';
import { Button } from '@/components/Button';
import { ColorPresetPicker } from '@/components/ColorPresetPicker';
import { IconButton } from '@/components/IconButton';
import { IconPicker } from '@/components/IconPicker';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectTemplates, useTemplateStore } from '@/store';
import { makeStyles, useTheme } from '@/theme';

interface TemplateFormErrors {
  readonly name?: string | undefined;
  readonly startTime?: string | undefined;
  readonly endTime?: string | undefined;
  readonly breakMinutes?: string | undefined;
  readonly hourlyRate?: string | undefined;
}

export function TemplateEditorScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.TEMPLATE_EDITOR>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { theme } = useTheme();

  const templateId = route.params?.templateId;
  const isEditing = templateId !== undefined;

  const templates = useTemplateStore(selectTemplates);
  const existing = templates.find((t) => t.id === templateId);

  const initialIcon: ShiftIconName =
    existing !== undefined && isShiftIconName(existing.icon) ? existing.icon : DEFAULT_SHIFT_ICON;

  const [name, setName] = useState(existing?.name ?? '');
  const [isOff, setIsOff] = useState(existing?.isOff ?? false);
  const [icon, setIcon] = useState<ShiftIconName>(initialIcon);
  const [color, setColor] = useState(existing?.color ?? '#5B7DB1');
  const [startTime, setStartTime] = useState<string>(existing?.startTime ?? '07:00');
  const [endTime, setEndTime] = useState<string>(existing?.endTime ?? '15:00');
  const [breakMinutes, setBreakMinutes] = useState(
    existing !== undefined ? String(existing.breakMinutes) : '30',
  );
  const [hourlyRate, setHourlyRate] = useState(
    existing?.hourlyRate !== null && existing?.hourlyRate !== undefined
      ? String(existing.hourlyRate)
      : '',
  );

  const [errors, setErrors] = useState<TemplateFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: TemplateFormErrors = {
      ...(name.trim() ? {} : { name: 'Template name is required' }),
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
      ...(!isOff &&
      hourlyRate.trim().length > 0 &&
      (Number.isNaN(Number(hourlyRate)) || Number(hourlyRate) < 0)
        ? { hourlyRate: 'Hourly rate must be a positive number' }
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
      const validRate = !isOff && hourlyRate.trim().length > 0 ? Number(hourlyRate) : null;

      if (isEditing && existing !== undefined) {
        await useTemplateStore.getState().updateTemplate({
          ...existing,
          name: name.trim(),
          icon,
          color,
          isOff,
          startTime: validStartTime,
          endTime: validEndTime,
          breakMinutes: validBreak,
          hourlyRate: validRate,
        });
      } else {
        await useTemplateStore.getState().createTemplate({
          name: name.trim(),
          icon,
          color,
          isOff,
          startTime: validStartTime,
          endTime: validEndTime,
          breakMinutes: validBreak,
          hourlyRate: validRate,
          reminderOverride: null,
        });
      }

      haptics.success();
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
        <Text variant="title" weight="semibold">
          {isEditing ? 'Edit Template' : 'New Template'}
        </Text>
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
          <View style={styles.section}>
            <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
              Template Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="e.g. Day, Evening, Night"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, errors.name !== undefined && styles.inputError]}
              accessibilityLabel="Template name"
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
                Off Shift Template
              </Text>
              <Text variant="caption" tone="muted">
                Represents scheduled days off
              </Text>
            </View>
            <Switch
              value={isOff}
              onValueChange={setIsOff}
              accessibilityLabel="Off shift template toggle"
            />
          </View>

          {!isOff ? (
            <>
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

              <View style={styles.section}>
                <Text variant="bodySmall" weight="semibold" style={styles.fieldLabel}>
                  Hourly Rate ($ optional)
                </Text>
                <TextInput
                  value={hourlyRate}
                  onChangeText={(text) => {
                    setHourlyRate(text);
                    if (errors.hourlyRate) {
                      setErrors((prev) => ({ ...prev, hourlyRate: undefined }));
                    }
                  }}
                  placeholder="e.g. 35.50"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.input, errors.hourlyRate !== undefined && styles.inputError]}
                  accessibilityLabel="Hourly rate"
                />
                {errors.hourlyRate !== undefined ? (
                  <Text variant="caption" tone="danger" style={styles.errorText}>
                    {errors.hourlyRate}
                  </Text>
                ) : null}
              </View>
            </>
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

          <View style={styles.actionsContainer}>
            <Button
              label={isEditing ? 'Save Template' : 'Create Template'}
              variant="primary"
              disabled={isSubmitting}
              onPress={() => void handleSave()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default TemplateEditorScreen;

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
  fieldLabel: {
    paddingHorizontal: theme.spacing.xs,
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
}));
