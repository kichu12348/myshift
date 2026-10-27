import type { ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DEFAULT_SHIFT_ICON, isShiftIconName } from '@/constants';
import {
  DEFAULT_REMINDER_PREFERENCES,
  formatDurationHoursMinutes,
  resolveEffectiveOffsets,
  type LocalDate,
  type ReminderPreferences,
  type ResolvedShift,
  type ShiftTemplate,
  type TimeFormatSetting,
} from '@/domain';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { selectSettings, selectTemplates, useSettingsStore, useTemplateStore } from '@/store';
import { SHIFT_PILL_FILL_ALPHA, makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatCompactDate, formatShiftTimeRange } from '@/utils';

export interface DockedDayPanelProps {
  readonly date: LocalDate;
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly timeFormat: TimeFormatSetting;
  readonly activeStampTemplateId: string | null;
  readonly onToggleStampBrush: (template: ShiftTemplate) => void;
  readonly onClearStampBrush: () => void;
  readonly onEditDate: (date: LocalDate) => void;
  readonly onDeleteShift: (shift: ResolvedShift) => void;
}

/**
 * Persistent docked day inspector and template stamp strip in Month view.
 * Sits directly below MonthGrid in the split layout.
 */
export function DockedDayPanel({
  date,
  shifts,
  timeFormat,
  activeStampTemplateId,
  onToggleStampBrush,
  onClearStampBrush,
  onEditDate,
  onDeleteShift,
}: DockedDayPanelProps): ReactElement {
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

  const formattedDate = formatCompactDate(date);
  const isStampActive = activeStampTemplateId !== null;

  return (
    <View style={styles.container}>
      {/* Part A: Selected Day Inspector */}
      <View style={styles.inspectorSection}>
        <View style={styles.inspectorHeader}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {formattedDate}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit shifts for ${formattedDate}`}
            onPress={() => onEditDate(date)}
            style={({ pressed }) => [styles.actionPill, pressed && styles.pressed]}
          >
            <Text variant="caption" weight="semibold" tone="accent">
              {shifts.length > 0 ? 'Edit' : '+ Custom'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.shiftListContainer}>
          {shifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodySmall" tone="muted">
                {'No shifts scheduled \u2014 tap a template below to add'}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.shiftListScroll}
            >
              {shifts.map((shift) => {
                const template =
                  shift.templateId !== null
                    ? templates.find((t) => t.id === shift.templateId)
                    : undefined;
                const rawColor = template?.color ?? shift.color;
                const resolvedColor = resolveShiftColor(rawColor, theme.mode);
                const iconName = isShiftIconName(shift.icon) ? shift.icon : DEFAULT_SHIFT_ICON;

                const timeRangeText = formatShiftTimeRange(
                  shift.startsAt,
                  shift.endsAt,
                  shift.isOff,
                  timeFormat,
                );
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

                return (
                  <View key={shift.id} style={styles.shiftCard}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                      ]}
                    >
                      <Icon name={iconName} size={20} color={resolvedColor} />
                    </View>

                    <View style={styles.shiftDetails}>
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {shift.name}
                      </Text>
                      <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
                        {timeAndDuration}
                      </Text>
                      {effectiveOffsets.length > 0 ? (
                        <View style={styles.reminderChipsRow}>
                          {effectiveOffsets.map((offset) => (
                            <View key={offset} style={styles.reminderChip}>
                              <Icon name="bell" size={theme.sizes.compactIconSize} tone="muted" />
                              <Text variant="micro" tone="muted" tabularNums>
                                {`${offset}m`}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {shift.notes.trim().length > 0 ? (
                        <Text variant="caption" tone="muted" numberOfLines={1}>
                          {shift.notes}
                        </Text>
                      ) : null}
                    </View>

                    <IconButton
                      iconName="trash-2"
                      tone="muted"
                      accessibilityLabel={`Delete ${shift.name} shift`}
                      onPress={() => onDeleteShift(shift)}
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Part B: Template Stamp Strip */}
      <View style={styles.stampSection}>
        <View style={styles.stampHeader}>
          <Text variant="caption" tone="muted" weight="semibold">
            STAMP / QUICK ADD
          </Text>
          {isStampActive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Turn off stamp mode"
              onPress={onClearStampBrush}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text variant="caption" tone="accent" weight="semibold">
                {'Stamp Mode: ON (tap days) \u2715'}
              </Text>
            </Pressable>
          ) : (
            <Text variant="caption" tone="muted">
              Tap template to stamp
            </Text>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateStripScroll}
        >
          {activeTemplates.map((template) => {
            const isBrushActive = activeStampTemplateId === template.id;
            const resolvedColor = resolveShiftColor(template.color, theme.mode);
            const iconName = isShiftIconName(template.icon) ? template.icon : DEFAULT_SHIFT_ICON;

            return (
              <Pressable
                key={template.id}
                accessibilityRole="button"
                accessibilityLabel={`Stamp ${template.name} template`}
                onPress={() => onToggleStampBrush(template)}
                style={({ pressed }) => [
                  styles.templateButton,
                  {
                    backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}`,
                    borderColor: isBrushActive ? resolvedColor : 'transparent',
                    borderWidth: isBrushActive ? theme.sizes.selectedBorder : theme.sizes.hairline,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Icon name={iconName} size={theme.sizes.compactIconSize} color={resolvedColor} />
                <Text
                  variant="bodySmall"
                  weight={isBrushActive ? 'semibold' : 'regular'}
                  style={{ color: resolvedColor }}
                >
                  {template.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 4.5,
    backgroundColor: theme.colors.surface,
    borderTopWidth: theme.sizes.hairline,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  inspectorSection: {
    flex: 1,
    overflow: 'hidden',
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xs,
  },
  actionPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  shiftListContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  shiftListScroll: {
    gap: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  iconBadge: {
    width: theme.sizes.iconBadgeSmall,
    height: theme.sizes.iconBadgeSmall,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftDetails: {
    flex: 1,
    gap: theme.sizes.size1,
  },
  reminderChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
    borderRadius: theme.radius.sm,
    gap: theme.sizes.size1,
  },
  stampSection: {
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateStripScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
}));
