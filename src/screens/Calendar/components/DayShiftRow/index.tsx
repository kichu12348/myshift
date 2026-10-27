import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  DEFAULT_REMINDER_PREFERENCES,
  formatDurationHoursMinutes,
  resolveEffectiveOffsets,
  type ReminderPreferences,
  type ResolvedShift,
  type TimeFormatSetting,
} from '@/domain';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { haptics } from '@/services';
import {
  selectSettings,
  selectTemplates,
  useRotationStore,
  useSettingsStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatShiftTimeRange } from '@/utils';

export interface DayShiftRowProps {
  readonly shift: ResolvedShift;
  readonly timeFormat: TimeFormatSetting;
  readonly onCopy: (shift: ResolvedShift) => void;
  readonly onEdit?: ((shift: ResolvedShift) => void) | undefined;
}

/**
 * Renders a rich shift detail block inside the day detail sheet.
 * Features squircle icon badge, net duration, reminder chips, notes row, and actions.
 */
export function DayShiftRow({ shift, timeFormat, onCopy, onEdit }: DayShiftRowProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const settings = useSettingsStore(selectSettings);
  const reminderPreferences: ReminderPreferences = settings
    ? {
        enabled: settings.remindersEnabled,
        minutesBefore: settings.defaultMinutesBefore,
      }
    : DEFAULT_REMINDER_PREFERENCES;

  const templates = useTemplateStore(selectTemplates);
  const activeTemplates = templates.filter((t) => t.archivedAt === null);
  const template =
    shift.templateId !== null ? templates.find((t) => t.id === shift.templateId) : undefined;

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const iconName = isShiftIconName(shift.icon) ? shift.icon : DEFAULT_SHIFT_ICON;
  const rawColor = template?.color ?? shift.color;
  const resolvedColor = resolveShiftColor(rawColor, theme.mode);
  const timeRangeText = formatShiftTimeRange(shift.startsAt, shift.endsAt, shift.isOff, timeFormat);

  const durationMinutes = Math.max(
    0,
    Math.round((shift.endsAt - shift.startsAt) / 60_000) - shift.breakMinutes,
  );
  const netHours = formatDurationHoursMinutes(durationMinutes);
  const timeAndDuration = shift.isOff ? 'All day' : `${timeRangeText} \u00b7 ${netHours}`;

  const effectiveOffsets = !shift.isOff
    ? resolveEffectiveOffsets(
        shift.reminderOverride,
        template?.reminderOverride ?? null,
        reminderPreferences,
      )
    : [];

  const handleLongPress = (): void => {
    haptics.selection();
    onCopy(shift);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  const handleSwapTemplate = async (templateId: string): Promise<void> => {
    if (shift.rotationId === null) {
      return;
    }
    haptics.success();
    await useRotationStore.getState().upsertException({
      rotationId: shift.rotationId,
      date: shift.date,
      kind: 'replace',
      templateId,
    });
    setIsSwapping(false);
  };

  if (isSwapping) {
    return (
      <View style={styles.swapContainer}>
        <View style={styles.swapHeader}>
          <Text variant="caption" tone="muted">
            Replace with template:
          </Text>
          <TextButton
            label="Cancel"
            tone="muted"
            onPress={() => setIsSwapping(false)}
            accessibilityLabel="Cancel swap"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.swapChipsRow}
        >
          {activeTemplates.map((activeTemplate) => (
            <Chip
              key={activeTemplate.id}
              label={activeTemplate.name}
              color={activeTemplate.color}
              iconName={
                isShiftIconName(activeTemplate.icon) ? activeTemplate.icon : DEFAULT_SHIFT_ICON
              }
              onPress={() => void handleSwapTemplate(activeTemplate.id)}
              accessibilityLabel={`Replace rotation shift with ${activeTemplate.name}`}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (isConfirming) {
    return (
      <View style={styles.confirmContainer}>
        <Text variant="bodySmall" tone="muted" style={styles.confirmText}>
          {shift.origin === 'rotation'
            ? 'Remove rotation shift for this day?'
            : 'Delete this shift?'}
        </Text>
        <View style={styles.confirmActions}>
          <TextButton
            label="Delete"
            tone="danger"
            disabled={isDeleting}
            onPress={() => void handleConfirmDelete()}
            accessibilityLabel={`Confirm delete ${shift.name}`}
          />
          <TextButton
            label="Cancel"
            tone="muted"
            disabled={isDeleting}
            onPress={() => setIsConfirming(false)}
            accessibilityLabel="Cancel delete"
          />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${shift.name}, ${timeRangeText}`}
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
          ]}
        >
          <Icon name={iconName} size={22} color={resolvedColor} />
        </View>
        <View style={styles.rightStack}>
          <View style={styles.titleRow}>
            <Text variant="body" weight="semibold" numberOfLines={1} style={styles.titleText}>
              {shift.name}
            </Text>
            {shift.origin === 'rotation' ? (
              <View style={styles.rotationBadge}>
                <Text variant="caption" tone="muted">
                  Rotation
                </Text>
              </View>
            ) : null}
            <View style={styles.actionsRow}>
              {shift.origin === 'rotation' && shift.rotationId !== null ? (
                <IconButton
                  iconName="refresh-cw"
                  tone="muted"
                  accessibilityLabel={`Swap ${shift.name}`}
                  onPress={() => setIsSwapping(true)}
                />
              ) : null}
              {onEdit !== undefined ? (
                <IconButton
                  iconName="edit-2"
                  tone="muted"
                  accessibilityLabel={`Edit ${shift.name}`}
                  onPress={() => onEdit(shift)}
                />
              ) : null}
              <IconButton
                iconName="trash-2"
                tone="muted"
                accessibilityLabel={`Delete ${shift.name}`}
                onPress={() => setIsConfirming(true)}
              />
            </View>
          </View>
          <Text variant="bodySmall" tone="muted" tabularNums>
            {timeAndDuration}
          </Text>
          {effectiveOffsets.length > 0 ? (
            <View style={styles.reminderChipsRow}>
              {effectiveOffsets.map((offset) => (
                <View key={offset} style={styles.reminderChip}>
                  <Icon name="bell" size={12} tone="muted" />
                  <Text variant="caption" tone="muted" tabularNums>
                    {`${offset}m`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {shift.notes.trim().length > 0 ? (
        <>
          <View style={styles.notesDivider} />
          <View style={styles.notesRow}>
            <Icon name="file-text" size={16} tone="muted" />
            <Text variant="bodySmall" tone="muted" style={styles.notesText}>
              {shift.notes}
            </Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardPressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  iconBadge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightStack: {
    flex: 1,
    gap: theme.sizes.size1 * 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  titleText: {
    flex: 1,
  },
  rotationBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.hairline,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  reminderChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.sizes.size1 * 2,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.sizes.size1 * 2,
    minHeight: theme.sizes.reminderChipHeight,
  },
  notesDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  notesText: {
    flex: 1,
  },
  swapContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  swapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  swapChipsRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  confirmContainer: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  confirmText: {
    flex: 1,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
