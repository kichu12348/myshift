import { useMemo, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import {
  DEFAULT_SHIFT_ICON,
  isShiftIconName,
} from '@/constants';
import type {
  LocalDate,
  ResolvedShift,
  ShiftTemplate,
  TimeFormatSetting,
} from '@/domain';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { haptics } from '@/services';
import { selectTemplates, useShiftStore, useTemplateStore } from '@/store';
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
}

/**
 * Bottom sheet displaying all scheduled shifts for the selected day,
 * quick-add template chips, and paste actions.
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
}: DayDetailSheetProps): ReactElement {
  const styles = useStyles();

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
        <IconButton
          iconName="x"
          accessibilityLabel="Close day details"
          onPress={onClose}
        />
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

      <ScrollView
        style={styles.shiftsList}
        contentContainerStyle={styles.shiftsContent}
      >
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
            />
          ))
        )}
      </ScrollView>

      {activeTemplates.length > 0 ? (
        <View style={styles.quickAddSection}>
          <Text variant="caption" tone="muted" style={styles.quickAddHeading}>
            Quick Add
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAddScroll}
          >
            {activeTemplates.map((template) => (
              <Chip
                key={template.id}
                label={template.name}
                iconName={
                  isShiftIconName(template.icon)
                    ? template.icon
                    : DEFAULT_SHIFT_ICON
                }
                color={template.color}
                onPress={() => void handleAddTemplate(template)}
                accessibilityLabel={`Add ${template.name} shift`}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
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
  quickAddSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  quickAddHeading: {
    paddingHorizontal: theme.spacing.xs,
  },
  quickAddScroll: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
}));
