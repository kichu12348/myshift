import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName, WEEKDAY_SHORT_NAMES } from '@/constants';
import {
  computeShiftDurationMinutes,
  formatDurationHoursMinutes,
  getDayOfWeek,
  getWeekDates,
  isOvernightShift,
  isWeekendDay,
  parseLocalDate,
  type LocalDate,
  type ResolvedShift,
  type ShiftOrigin,
  type ShiftTemplate,
  type TimeFormatSetting,
  type WeekStart,
} from '@/domain';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ShiftPill } from '@/components/ShiftPill';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { selectTemplates, useShiftStore, useTemplateStore } from '@/store';
import { makeStyles } from '@/theme';
import { formatLongDate, formatShiftTimeRange } from '@/utils';

export interface DayViewProps {
  readonly selectedDate: LocalDate;
  readonly today: LocalDate;
  readonly weekStart: WeekStart;
  readonly timeFormat: TimeFormatSetting;
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly onSelectDate: (date: LocalDate) => void;
  readonly onEditShift: (shift: ResolvedShift) => void;
  readonly onCustomShift: () => void;
  readonly onAddShiftFromTemplate?: ((template: ShiftTemplate) => void) | undefined;
}

function getOriginBadgeLabel(origin: ShiftOrigin): string {
  switch (origin) {
    case 'manual':
      return 'Manual';
    case 'rotation':
      return 'Rotation';
    case 'rotation_override':
      return 'Modified';
  }
}

/**
 * Day view calendar component displaying a 7-day navigation strip,
 * full details of all shifts on selectedDate, and inline quick-add controls.
 */
export function DayView({
  selectedDate,
  today,
  weekStart,
  timeFormat,
  shifts,
  onSelectDate,
  onEditShift,
  onCustomShift,
  onAddShiftFromTemplate,
}: DayViewProps): ReactElement {
  const styles = useStyles();

  const templates = useTemplateStore(selectTemplates);
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.archivedAt === null),
    [templates],
  );

  const weekDates = useMemo(() => getWeekDates(selectedDate, weekStart), [selectedDate, weekStart]);

  const handleSelectDatePress = (date: LocalDate): void => {
    if (date !== selectedDate) {
      haptics.selection();
      onSelectDate(date);
    }
  };

  const handleAddTemplate = async (template: ShiftTemplate): Promise<void> => {
    haptics.success();
    if (onAddShiftFromTemplate !== undefined) {
      onAddShiftFromTemplate(template);
      return;
    }
    await useShiftStore.getState().createShift({
      date: selectedDate,
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.weekStrip} accessibilityRole="tablist">
        {weekDates.map((date) => {
          const dow = getDayOfWeek(date);
          const weekday = WEEKDAY_SHORT_NAMES[dow] ?? '';
          const { day } = parseLocalDate(date);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const isWeekend = isWeekendDay(dow);

          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={formatLongDate(date)}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelectDatePress(date)}
              style={({ pressed }) => [
                styles.stripCell,
                isSelected ? styles.stripCellSelected : styles.stripCellUnselected,
                !isSelected && isWeekend && styles.stripCellWeekend,
                pressed && styles.stripCellPressed,
              ]}
            >
              <Text variant="caption" tone="muted">
                {weekday}
              </Text>
              {isToday ? (
                <View style={styles.todayMarker}>
                  <Text variant="caption" weight="semibold" style={styles.todayText}>
                    {day}
                  </Text>
                </View>
              ) : (
                <Text variant="bodySmall" weight="semibold" tone="text">
                  {day}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.shiftsSection}>
        {shifts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text variant="bodySmall" tone="muted">
              No shifts scheduled for this day
            </Text>
          </View>
        ) : (
          shifts.map((shift) => {
            const duration = computeShiftDurationMinutes(shift);
            const durationText = formatDurationHoursMinutes(duration.netMinutes);
            const timeRangeText = formatShiftTimeRange(
              shift.startsAt,
              shift.endsAt,
              shift.isOff,
              timeFormat,
            );

            return (
              <Pressable
                key={shift.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${shift.name}`}
                onPress={() => onEditShift(shift)}
                style={({ pressed }) => [styles.shiftCard, pressed && styles.shiftCardPressed]}
              >
                <View style={styles.shiftHeaderRow}>
                  <View style={styles.pillWrapper}>
                    <ShiftPill
                      name={shift.name}
                      icon={shift.icon}
                      color={shift.color}
                      isOff={shift.isOff}
                      isOvernight={isOvernightShift(shift)}
                    />
                  </View>
                  <View style={styles.originBadge}>
                    <Text variant="caption" tone="muted">
                      {getOriginBadgeLabel(shift.origin)}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text variant="caption" tone="muted" tabularNums>
                    {timeRangeText}
                  </Text>
                  {!shift.isOff ? (
                    <Text variant="caption" tone="muted">
                      {` \u2022 ${durationText}`}
                    </Text>
                  ) : null}
                  {shift.breakMinutes > 0 ? (
                    <Text variant="caption" tone="muted">
                      {` \u2022 ${shift.breakMinutes}m break`}
                    </Text>
                  ) : null}
                </View>

                {shift.notes.trim() !== '' ? (
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {shift.notes}
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.quickAddSection}>
        <Text variant="caption" tone="muted" style={styles.sectionHeading}>
          Quick Add
        </Text>
        {activeTemplates.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
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
        ) : null}
        <Button
          label="+ Custom shift"
          variant="secondary"
          onPress={onCustomShift}
          accessibilityLabel="Create custom shift"
        />
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  stripCell: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  stripCellSelected: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
  },
  stripCellUnselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  stripCellWeekend: {
    backgroundColor: theme.colors.weekendTint,
  },
  stripCellPressed: {
    opacity: 0.8,
  },
  todayMarker: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    color: theme.colors.onAccent,
  },
  shiftsSection: {
    gap: theme.spacing.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  shiftCardPressed: {
    opacity: 0.8,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  pillWrapper: {
    flex: 1,
  },
  originBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.hairline,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddSection: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  sectionHeading: {
    paddingHorizontal: theme.spacing.xs,
  },
  chipsRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
}));
