import type { ReactElement } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { makeStyles } from '@/theme';
import { formatDayOrdinal } from '../../types';

export interface PaydayCutoffModalProps {
  readonly visible: boolean;
  readonly selectedDay: number;
  readonly onSelectDay: (day: number) => void;
  readonly onClose: () => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function PaydayCutoffModal({
  visible,
  selectedDay,
  onSelectDay,
  onClose,
}: PaydayCutoffModalProps): ReactElement {
  const styles = useStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Dismiss modal" />
        <View style={styles.container}>
          <Text variant="title" weight="semibold">
            Payday Cutoff Day
          </Text>
          <Text variant="caption" tone="muted">
            Select the day of the month your pay period ends.
          </Text>

          <ScrollView contentContainerStyle={styles.grid}>
            {DAYS.map((day) => {
              const isSelected = day === selectedDay;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${formatDayOrdinal(day)}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onSelectDay(day);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    weight={isSelected ? 'semibold' : 'regular'}
                    tone={isSelected ? 'onAccent' : 'text'}
                    tabularNums
                  >
                    {String(day)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Button label="Done" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dismissArea: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxWidth: theme.sizes.timeModalMaxWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  dayCell: {
    width: theme.sizes.calendarModalCellSize,
    height: theme.sizes.calendarModalCellSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
}));
