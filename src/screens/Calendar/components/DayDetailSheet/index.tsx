import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import type { LocalDate, ResolvedShift, ShiftTemplate, TimeFormatSetting } from '@/domain';
import { Icon } from '@/components/Icon';
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
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatCompactDate, formatLongDate } from '@/utils';
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
  readonly onEnterStampMode?: ((templateId: string) => void) | undefined;
  readonly paintingTemplate?: ShiftTemplate | null | undefined;
  readonly onTogglePaintMode?: ((template: ShiftTemplate) => void) | undefined;
  readonly onClearPaintMode?: (() => void) | undefined;
}

/**
 * Bottom sheet displaying all scheduled shifts for the selected day,
 * quick-add template buttons with paint mode, and rich shift detail.
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
  onEnterStampMode,
  paintingTemplate,
  onTogglePaintMode,
  onClearPaintMode,
}: DayDetailSheetProps): ReactElement {
  const { theme } = useTheme();
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

  const handleEnterPaintMode = (): void => {
    if (onEnterStampMode !== undefined) {
      const defaultTplId = activeTemplates[0]?.id ?? '';
      onEnterStampMode(defaultTplId);
      onClose();
    }
  };

  const firstShift = shifts[0];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={`Day details for ${formatLongDate(date)}`}
    >
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {formatCompactDate(date)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {firstShift !== undefined && onEditShift !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit shift"
              onPress={() => onEditShift(firstShift)}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Icon name="edit-2" size={theme.sizes.iconSizeSmall} tone="text" />
              <Text variant="bodySmall" weight="semibold">
                Edit
              </Text>
            </Pressable>
          ) : onCustomShift !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create custom shift"
              onPress={onCustomShift}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Icon name="plus" size={theme.sizes.iconSizeSmall} tone="text" />
              <Text variant="bodySmall" weight="semibold">
                + Custom
              </Text>
            </Pressable>
          ) : null}
          <IconButton iconName="x" accessibilityLabel="Close day details" onPress={onClose} />
        </View>
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
              No shifts scheduled on this day
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

      <View style={styles.quickAddSection}>
        <View style={styles.quickAddHeaderRow}>
          <Text variant="caption" tone="muted" weight="semibold">
            Add shift (template)
          </Text>
          {onEnterStampMode !== undefined && activeTemplates.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paint multiple days"
              onPress={handleEnterPaintMode}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text variant="caption" tone="accent" weight="semibold">
                Paint multiple days
              </Text>
            </Pressable>
          ) : paintingTemplate != null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Stop painting ${paintingTemplate.name}`}
              onPress={onClearPaintMode}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: resolveShiftColor(paintingTemplate.color, theme.mode) }}
              >
                {`Painting: ${paintingTemplate.name} \u2715`}
              </Text>
            </Pressable>
          ) : (
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
          )}
        </View>
        {activeTemplates.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAddScroll}
          >
            {activeTemplates.map((template) => {
              const isPainting = paintingTemplate?.id === template.id;
              const resolvedColor = resolveShiftColor(template.color, theme.mode);
              const iconName = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

              return (
                <Pressable
                  key={template.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${template.name} shift`}
                  onPress={() => void handleAddTemplate(template)}
                  onLongPress={() => {
                    if (onTogglePaintMode !== undefined) {
                      haptics.selection();
                      onTogglePaintMode(template);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.templateButton,
                    {
                      backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                      borderColor: isPainting ? resolvedColor : 'transparent',
                      borderWidth: isPainting ? theme.sizes.selectedBorder : theme.sizes.hairline,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon name={iconName} size={16} color={resolvedColor} />
                  <Text
                    variant="bodySmall"
                    weight="semibold"
                    style={{ color: resolvedColor }}
                  >
                    {template.name}
                  </Text>
                </Pressable>
              );
            })}
            {onCustomShift !== undefined ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create custom shift"
                onPress={onCustomShift}
                style={({ pressed }) => [styles.customPlusButton, pressed && styles.pressed]}
              >
                <Icon name="plus" size={20} tone="text" />
              </Pressable>
            ) : null}
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
  handle: {
    width: theme.sizes.sheetHandleWidth,
    height: theme.sizes.sheetHandleHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  editButton: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
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
    maxHeight: theme.sizes.sheetListMaxHeight,
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
  quickAddScroll: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  customPlusButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTemplatesText: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
}));
