import { useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SHIFT_ICON, isShiftIconName, type ShiftIconName } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import {
  minutesToTimeOfDay,
  timeOfDayToMinutes,
  type TimeOfDay,
} from '@/domain';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectSettings, selectTemplates, useSettingsStore, useTemplateStore } from '@/store';
import { DEFAULT_NIGHT_COLOR, makeStyles } from '@/theme';
import { TemplateAppearancePicker } from './components/TemplateAppearancePicker';
import { TemplateDeleteCard } from './components/TemplateDeleteCard';
import { TemplateIdentityCard } from './components/TemplateIdentityCard';
import { TemplateLivePreview } from './components/TemplateLivePreview';
import { TemplateScheduleCard } from './components/TemplateScheduleCard';

interface TemplateFormErrors {
  readonly name?: string | undefined;
  readonly breakMinutes?: string | undefined;
  readonly hourlyRate?: string | undefined;
}

export function TemplateEditorScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.TEMPLATE_EDITOR>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const settings = useSettingsStore(selectSettings);
  const timeFormat = settings?.timeFormat ?? '24h';

  const templateId = route.params?.templateId;
  const isEditing = templateId !== undefined;

  const templates = useTemplateStore(selectTemplates);
  const existing = templates.find((t) => t.id === templateId);

  const initialIcon: ShiftIconName =
    existing !== undefined && isShiftIconName(existing.icon) ? existing.icon : DEFAULT_SHIFT_ICON;

  const initialStartMinutes =
    existing !== undefined ? timeOfDayToMinutes(existing.startTime) : 7 * 60; // 07:00
  const initialEndMinutes =
    existing !== undefined ? timeOfDayToMinutes(existing.endTime) : 15 * 60; // 15:00

  const [name, setName] = useState(existing?.name ?? '');
  const [isOff, setIsOff] = useState(existing?.isOff ?? false);
  const [icon, setIcon] = useState<ShiftIconName>(initialIcon);
  const [color, setColor] = useState(existing?.color ?? DEFAULT_NIGHT_COLOR);
  const [startMinutes, setStartMinutes] = useState<number>(initialStartMinutes);
  const [endMinutes, setEndMinutes] = useState<number>(initialEndMinutes);
  const [breakMinutes, setBreakMinutes] = useState<number>(existing?.breakMinutes ?? 30);
  const [hourlyRate, setHourlyRate] = useState(
    existing?.hourlyRate !== null && existing?.hourlyRate !== undefined
      ? String(existing.hourlyRate)
      : '',
  );

  const [errors, setErrors] = useState<TemplateFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: TemplateFormErrors = {
      ...(name.trim().length > 0 ? {} : { name: 'Template name is required' }),
      ...(!isOff && (!Number.isInteger(breakMinutes) || breakMinutes < 0)
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
      const validStartTime: TimeOfDay = isOff ? '00:00' : minutesToTimeOfDay(startMinutes);
      const validEndTime: TimeOfDay = isOff ? '00:00' : minutesToTimeOfDay(endMinutes);
      const validBreak = isOff ? 0 : breakMinutes;
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

  const handleDelete = async (): Promise<void> => {
    if (!isEditing || existing === undefined) {
      return;
    }

    setIsSubmitting(true);
    try {
      await useTemplateStore.getState().archiveTemplate(existing.id);
      haptics.warning();
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
      <View style={styles.topBar}>
        <IconButton
          iconName="chevron-left"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title" weight="semibold">
          {isEditing ? 'Edit Template' : 'New Template'}
        </Text>
        <View style={styles.topBarSpacer} />
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
          <TemplateLivePreview
            name={name}
            icon={icon}
            color={color}
            isOff={isOff}
            startTime={minutesToTimeOfDay(startMinutes)}
            endTime={minutesToTimeOfDay(endMinutes)}
            breakMinutes={breakMinutes}
            timeFormat={timeFormat}
          />

          <TemplateIdentityCard
            name={name}
            onChangeName={(val) => {
              setName(val);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            nameError={errors.name}
            isOff={isOff}
            onToggleOff={setIsOff}
          />

          {!isOff ? (
            <TemplateScheduleCard
              startMinutes={startMinutes}
              onChangeStartMinutes={setStartMinutes}
              endMinutes={endMinutes}
              onChangeEndMinutes={setEndMinutes}
              breakMinutes={breakMinutes}
              onChangeBreakMinutes={(val) => {
                setBreakMinutes(val);
                if (errors.breakMinutes) {
                  setErrors((prev) => ({ ...prev, breakMinutes: undefined }));
                }
              }}
              hourlyRate={hourlyRate}
              onChangeHourlyRate={(val) => {
                setHourlyRate(val);
                if (errors.hourlyRate) {
                  setErrors((prev) => ({ ...prev, hourlyRate: undefined }));
                }
              }}
              timeFormat={timeFormat}
              isOff={isOff}
              errors={errors}
            />
          ) : null}

          <TemplateAppearancePicker
            selectedColor={color}
            onSelectColor={setColor}
            selectedIcon={icon}
            onSelectIcon={setIcon}
          />

          <View style={styles.actionsContainer}>
            <Button
              label={isEditing ? 'Save Template' : 'Create Template'}
              variant="primary"
              disabled={isSubmitting}
              onPress={() => void handleSave()}
            />

            {isEditing ? (
              <TemplateDeleteCard
                onDelete={() => void handleDelete()}
                isDeleting={isSubmitting}
              />
            ) : null}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  topBarSpacer: {
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
    gap: theme.spacing.lg,
  },
  actionsContainer: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
}));
