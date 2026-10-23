import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import {
  DEFAULT_SHIFT_ICON,
  isShiftIconName,
} from '@/constants';
import type { ResolvedShift, TimeFormatSetting } from '@/domain';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/TextButton';
import { haptics } from '@/services';
import { useRotationStore, useShiftStore } from '@/store';
import { makeStyles, resolveShiftColor, useTheme } from '@/theme';
import { formatShiftTimeRange } from '@/utils';

export interface DayShiftRowProps {
  readonly shift: ResolvedShift;
  readonly timeFormat: TimeFormatSetting;
  readonly onCopy: (shift: ResolvedShift) => void;
  readonly onEdit?: ((shift: ResolvedShift) => void) | undefined;
}

/**
 * Renders a single shift row inside the day detail sheet.
 * Supports long-press to copy and two-step inline danger confirmation before deletion.
 */
export function DayShiftRow({
  shift,
  timeFormat,
  onCopy,
  onEdit,
}: DayShiftRowProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const iconName = isShiftIconName(shift.icon) ? shift.icon : DEFAULT_SHIFT_ICON;
  const resolvedColor = resolveShiftColor(shift.color, theme.mode);
  const timeRangeText = formatShiftTimeRange(
    shift.startsAt,
    shift.endsAt,
    shift.isOff,
    timeFormat,
  );

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
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.colorBar, { backgroundColor: resolvedColor }]} />
      <Icon name={iconName} size={20} tone="text" />
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {shift.name}
          </Text>
          {shift.origin === 'rotation' ? (
            <View style={styles.rotationBadge}>
              <Text variant="caption" tone="muted">
                Rotation
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text variant="caption" tone="muted" tabularNums>
            {timeRangeText}
          </Text>
          {shift.breakMinutes > 0 ? (
            <Text variant="caption" tone="muted">
              {` \u2022 ${shift.breakMinutes}m break`}
            </Text>
          ) : null}
        </View>
      </View>
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
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  rowPressed: {
    opacity: 0.8,
  },
  colorBar: {
    width: theme.sizes.pillBarWidth,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
  },
  details: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rotationBadge: {
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
