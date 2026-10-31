import { useMemo, useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SHIFT_ICON, isShiftIconName, type ShiftIconName } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import {
  epochToTimeOfDay,
  minutesToTimeOfDay,
  timeOfDayToMinutes,
  type ShiftTemplate,
  type TimeOfDay,
} from '@/domain';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { ShiftAppearancePicker } from '@/components/ShiftAppearancePicker';
import { ShiftLivePreview } from '@/components/ShiftLivePreview';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import {
  selectSettings,
  selectTemplates,
  useRotationStore,
  useSettingsStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';
import { DEFAULT_SHIFT_COLOR, makeStyles } from '@/theme';
import { formatLongDate } from '@/utils';
import { ShiftDeleteCard } from './components/ShiftDeleteCard';
import { ShiftIdentityCard } from './components/ShiftIdentityCard';
import { ShiftRemindersAndNotesCard } from './components/ShiftRemindersAndNotesCard';
import { ShiftScheduleCard } from './components/ShiftScheduleCard';
import { ShiftTemplateStrip } from './components/ShiftTemplateStrip';

interface ShiftFormErrors {
  readonly name?: string | undefined;
  readonly breakMinutes?: string | undefined;
}

export function ShiftEditorScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.SHIFT_EDITOR>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const settings = useSettingsStore(selectSettings);
  const timeFormat = settings?.timeFormat ?? '24h';
  const defaultReminderOffsets = settings?.defaultMinutesBefore ?? [60, 30, 15];

  const { date, shift } = route.params;
  const isEditing = shift !== undefined;

  const initialIcon: ShiftIconName =
    shift !== undefined && isShiftIconName(shift.icon) ? shift.icon : DEFAULT_SHIFT_ICON;

  const initialStartMinutes =
    shift !== undefined && !shift.isOff
      ? timeOfDayToMinutes(epochToTimeOfDay(shift.startsAt))
      : 7 * 60; // 07:00

  const initialEndMinutes =
    shift !== undefined && !shift.isOff
      ? timeOfDayToMinutes(epochToTimeOfDay(shift.endsAt))
      : 15 * 60; // 15:00

  const [name, setName] = useState(shift?.name ?? '');
  const [templateId, setTemplateId] = useState<string | null>(shift?.templateId ?? null);
  const [isOff, setIsOff] = useState(shift?.isOff ?? false);
  const [icon, setIcon] = useState<ShiftIconName>(initialIcon);
  const [color, setColor] = useState(shift?.color ?? DEFAULT_SHIFT_COLOR);
  const [startMinutes, setStartMinutes] = useState<number>(initialStartMinutes);
  const [endMinutes, setEndMinutes] = useState<number>(initialEndMinutes);
  const [breakMinutes, setBreakMinutes] = useState<number>(shift?.breakMinutes ?? 30);
  const [notes, setNotes] = useState(shift?.notes ?? '');
  const [reminderOverride, setReminderOverride] = useState<number[] | null>(
    shift?.reminderOverride ?? null,
  );

  const [errors, setErrors] = useState<ShiftFormErrors>({});
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
    setStartMinutes(timeOfDayToMinutes(template.startTime));
    setEndMinutes(timeOfDayToMinutes(template.endTime));
    setBreakMinutes(template.breakMinutes);
    if (template.reminderOverride !== null) {
      setReminderOverride(template.reminderOverride);
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: ShiftFormErrors = {
      ...(name.trim().length > 0 ? {} : { name: 'Shift name is required' }),
      ...(!isOff && (!Number.isInteger(breakMinutes) || breakMinutes < 0)
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
      const validStartTime: TimeOfDay = isOff ? '00:00' : minutesToTimeOfDay(startMinutes);
      const validEndTime: TimeOfDay = isOff ? '00:00' : minutesToTimeOfDay(endMinutes);
      const validBreak = isOff ? 0 : breakMinutes;
      const validReminderOverride = isOff ? null : reminderOverride;

      if (shift !== undefined) {
        if (shift.origin === 'rotation') {
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
            reminderOverride: validReminderOverride,
          });
        } else {
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
            reminderOverride: validReminderOverride,
          });
        }
      } else {
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
          reminderOverride: validReminderOverride,
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
      <View style={styles.topBar}>
        <IconButton
          iconName="chevron-left"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.topBarTitleContainer}>
          <Text variant="title" weight="semibold">
            {isEditing ? 'Edit Shift' : 'New Shift'}
          </Text>
          <Text variant="caption" tone="muted">
            {formatLongDate(date)}
          </Text>
        </View>
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
          <ShiftLivePreview
            name={name}
            icon={icon}
            color={color}
            isOff={isOff}
            startTime={minutesToTimeOfDay(startMinutes)}
            endTime={minutesToTimeOfDay(endMinutes)}
            breakMinutes={breakMinutes}
            timeFormat={timeFormat}
          />

          {activeTemplates.length > 0 ? (
            <ShiftTemplateStrip
              templates={activeTemplates}
              selectedTemplateId={templateId}
              onSelectTemplate={handleApplyTemplate}
            />
          ) : null}

          <ShiftIdentityCard
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
            <ShiftScheduleCard
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
              timeFormat={timeFormat}
              isOff={isOff}
              error={errors.breakMinutes}
            />
          ) : null}

          <ShiftAppearancePicker
            selectedColor={color}
            onSelectColor={setColor}
            selectedIcon={icon}
            onSelectIcon={setIcon}
          />

          <ShiftRemindersAndNotesCard
            reminderOverride={reminderOverride}
            onChangeReminderOverride={setReminderOverride}
            defaultOffsets={defaultReminderOffsets}
            notes={notes}
            onChangeNotes={setNotes}
            isOff={isOff}
          />

          <View style={styles.actionsContainer}>
            <Button
              label={isEditing ? 'Save Changes' : 'Create Shift'}
              variant="primary"
              disabled={isSubmitting}
              onPress={() => void handleSave()}
            />

            {isEditing ? (
              <ShiftDeleteCard
                onDelete={() => void handleDelete()}
                isDeleting={isSubmitting}
                isRotationShift={shift.origin === 'rotation'}
              />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  topBarTitleContainer: {
    alignItems: 'center',
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
