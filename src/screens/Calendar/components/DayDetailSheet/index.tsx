import { useMemo, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { LocalDate, ResolvedShift, ShiftTemplate, TimeFormatSetting } from '@/domain';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { haptics } from '@/services';
import {
  selectExceptions,
  selectTemplates,
  useRotationStore,
  useShiftStore,
  useTemplateStore,
} from '@/store';
import { makeStyles } from '@/theme';
import { formatLongDate } from '@/utils';
import { DayShiftRow } from '../DayShiftRow';

export interface DayDetailSheetProps {
  readonly visible: boolean;
  readonly date: LocalDate;
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly copiedShift: ResolvedShift | null;
  readonly timeFormat: TimeFormatSetting;
  readonly onClose: () => void;
  readonly onCopyShift: (shift: ResolvedShift) => void;
  readonly onPasteShift: (date: LocalDate) => void;
  readonly onEditShift?: ((shift: ResolvedShift) => void) | undefined;
  readonly onCustomShift?: (() => void) | undefined;
  readonly onOpenTemplates?: (() => void) | undefined;
  readonly onOpenRotations?: (() => void) | undefined;
}

/**
 * Bottom sheet displaying all scheduled shifts for the selected day,
 * quick-add template chips, paste actions, and rotation exceptions.
 */
export function DayDetailSheet({
  visible,
  date,
  shifts,
  copiedShift,
  timeFormat,
  onClose,
  onCopyShift,
  onPasteShift,
  onEditShift,
  onCustomShift,
  onOpenTemplates,
  onOpenRotations,
}: DayDetailSheetProps): ReactElement {
  const styles = useStyles();

  const exceptions = useRotationStore(selectExceptions);
  const dayException = exceptions.find((ex) => ex.date === date);

  const templates = useTemplateStore(selectTemplates);
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.archivedAt === null),
    [templates],
  );

  const handleAddTemplate = async (template: ShiftTemplate): Promise<void> => {
    haptics.success();
    await useShiftStore.getState().createShift({
      date,
      templateId: template.id,
      name: template.name,
      icon: template.icon,
      color: template.color,
      isOff: template.isOff,
      startTime: template.startTime,
      endTime: template.endTime,
      breakMinutes: template.breakMinutes,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: template.reminderOverride,
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={`Day details for ${formatLongDate(date)}`}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {formatLongDate(date)}
          </Text>
        </View>
        <IconButton iconName="x" accessibilityLabel="Close day details" onPress={onClose} />
      </View>

      {copiedShift !== null ? (
        <View style={styles.pasteBar}>
          <Text variant="caption" tone="muted">
            {`Copied: ${copiedShift.name}`}
          </Text>
          <TextButton
            label={`Paste ${copiedShift.name}`}
            tone="accent"
            onPress={() => onPasteShift(date)}
            accessibilityLabel={`Paste ${copiedShift.name} to this day`}
          />
        </View>
      ) : null}

      {dayException !== undefined ? (
        <View style={styles.exceptionNotice}>
          <Text variant="caption" tone="muted">
            {dayException.kind === 'skip'
              ? 'Rotation shift skipped on this day'
              : 'Rotation shift replaced on this day'}
          </Text>
          <TextButton
            label="Restore rotation default"
            tone="accent"
            onPress={() => {
              haptics.success();
              void useRotationStore.getState().deleteException(dayException.rotationId, date);
            }}
            accessibilityLabel="Restore rotation default"
          />
        </View>
      ) : null}

      <ScrollView style={styles.shiftsList} contentContainerStyle={styles.shiftsContent}>
        {shifts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodySmall" tone="muted">
              No shifts scheduled for this day
            </Text>
          </View>
        ) : (
          shifts.map((shift) => (
            <DayShiftRow
              key={shift.id}
              shift={shift}
              timeFormat={timeFormat}
              onCopy={onCopyShift}
              onEdit={onEditShift}
            />
          ))
        )}
      </ScrollView>

      {onCustomShift !== undefined ? (
        <View style={styles.customActionContainer}>
          <Button
            label="+ Custom shift"
            variant="secondary"
            onPress={onCustomShift}
            accessibilityLabel="Create custom shift"
          />
        </View>
      ) : null}

      <View style={styles.quickAddSection}>
        <View style={styles.quickAddHeaderRow}>
          <Text variant="caption" tone="muted" style={styles.quickAddHeading}>
            Quick Add
          </Text>
          <View style={styles.quickAddHeaderActions}>
            {onOpenRotations !== undefined ? (
              <TextButton
                label="Rotations"
                tone="accent"
                onPress={onOpenRotations}
                accessibilityLabel="Manage shift rotations"
              />
            ) : null}
            {onOpenTemplates !== undefined ? (
              <TextButton
                label="Templates"
                tone="accent"
                onPress={onOpenTemplates}
                accessibilityLabel="Manage shift templates"
              />
            ) : null}
          </View>
        </View>
        {activeTemplates.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAddScroll}
          >
            {activeTemplates.map((template) => (
              <Chip
                key={template.id}
                label={template.name}
                iconName={isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON}
                color={template.color}
                onPress={() => void handleAddTemplate(template)}
                accessibilityLabel={`Add ${template.name} shift`}
              />
            ))}
          </ScrollView>
        ) : (
          <Text variant="caption" tone="muted" style={styles.noTemplatesText}>
            No active templates available
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  pasteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
  },
  exceptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  shiftsList: {
    maxHeight: 260,
    marginTop: theme.spacing.sm,
  },
  shiftsContent: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customActionContainer: {
    marginTop: theme.spacing.sm,
  },
  quickAddSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  quickAddHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  quickAddHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quickAddHeading: {
    paddingHorizontal: theme.spacing.xs,
  },
  quickAddScroll: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  noTemplatesText: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
}));
