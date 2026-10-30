import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  minutesToTimeParts,
  timeToMinutes12,
  timeToMinutes24,
} from '@/domain';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface TimePickerModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly initialMinutes: number; // 0..1439
  readonly timeFormat: '12h' | '24h';
  readonly onConfirm: (minutesFromMidnight: number) => void;
  readonly onClose: () => void;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES_5M = Array.from({ length: 12 }, (_, i) => i * 5);
const MINUTES_1M = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

export function TimePickerModal({
  visible,
  title,
  initialMinutes,
  timeFormat,
  onConfirm,
  onClose,
}: TimePickerModalProps): ReactElement {
  const styles = useStyles();

  const parts = minutesToTimeParts(initialMinutes, timeFormat);
  const [selectedHour, setSelectedHour] = useState(parts.hour);
  const [selectedMinute, setSelectedMinute] = useState(parts.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parts.period);
  const [is5mSteps, setIs5mSteps] = useState(parts.minute % 5 === 0);

  useEffect(() => {
    if (visible) {
      const p = minutesToTimeParts(initialMinutes, timeFormat);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
      setIs5mSteps(p.minute % 5 === 0);
    }
  }, [visible, initialMinutes, timeFormat]);

  const computedMinutes =
    timeFormat === '12h'
      ? timeToMinutes12(selectedHour, selectedMinute, selectedPeriod)
      : timeToMinutes24(selectedHour, selectedMinute);

  const previewTime =
    timeFormat === '12h'
      ? `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`
      : `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

  const hoursList = timeFormat === '12h' ? HOURS_12 : HOURS_24;
  const minutesList = is5mSteps ? MINUTES_5M : MINUTES_1M;

  const handleSelectHour = (hour: number): void => {
    haptics.selection();
    setSelectedHour(hour);
  };

  const handleSelectMinute = (min: number): void => {
    haptics.selection();
    setSelectedMinute(min);
  };

  const handleSelectPeriod = (period: 'AM' | 'PM'): void => {
    haptics.selection();
    setSelectedPeriod(period);
  };

  const handleToggleSteps = (): void => {
    haptics.selection();
    setIs5mSteps((prev) => !prev);
  };

  const handleDone = (): void => {
    haptics.success();
    onConfirm(computedMinutes);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      showHandle={true}
      expandable={true}
      accessibilityLabel={title}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleColumn}>
            <Text variant="title" weight="semibold">
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Toggle step size, currently ${is5mSteps ? '5 minute steps' : '1 minute steps'}`}
              onPress={handleToggleSteps}
              style={styles.stepChip}
            >
              <Text variant="micro" weight="semibold" tone="accent">
                {is5mSteps ? '5m steps' : '1m steps'}
              </Text>
            </Pressable>
          </View>

          <Text variant="title" weight="semibold" tone="accent" tabularNums>
            {previewTime}
          </Text>
        </View>

        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <Text variant="caption" tone="muted" weight="semibold" style={styles.columnHeader}>
              HOUR
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollColumn}
              contentContainerStyle={styles.scrollColumnContent}
            >
              {hoursList.map((h) => {
                const isSelected = selectedHour === h;
                const label = timeFormat === '24h' ? String(h).padStart(2, '0') : String(h);

                return (
                  <Pressable
                    key={h}
                    accessibilityRole="button"
                    accessibilityLabel={`Hour ${label}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelectHour(h)}
                    style={[styles.itemPressable, isSelected && styles.itemSelected]}
                  >
                    <Text
                      variant="body"
                      weight={isSelected ? 'semibold' : 'regular'}
                      tone={isSelected ? 'accent' : 'text'}
                      tabularNums
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.column}>
            <Text variant="caption" tone="muted" weight="semibold" style={styles.columnHeader}>
              MINUTE
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollColumn}
              contentContainerStyle={styles.scrollColumnContent}
            >
              {minutesList.map((m) => {
                const isSelected = selectedMinute === m;
                const label = String(m).padStart(2, '0');

                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityLabel={`Minute ${label}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelectMinute(m)}
                    style={[styles.itemPressable, isSelected && styles.itemSelected]}
                  >
                    <Text
                      variant="body"
                      weight={isSelected ? 'semibold' : 'regular'}
                      tone={isSelected ? 'accent' : 'text'}
                      tabularNums
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {timeFormat === '12h' ? (
            <View style={styles.periodColumn}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.columnHeader}>
                PERIOD
              </Text>
              <View style={styles.periodContainer}>
                {PERIODS.map((p) => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <Pressable
                      key={p}
                      accessibilityRole="button"
                      accessibilityLabel={`Period ${p}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectPeriod(p)}
                      style={[styles.periodPill, isSelected && styles.periodPillActive]}
                    >
                      <Text
                        variant="body"
                        weight="semibold"
                        tone={isSelected ? 'onAccent' : 'text'}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerButton}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
          <View style={styles.footerButton}>
            <Button label="Done" variant="primary" onPress={handleDone} />
          </View>
        </View>
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  titleColumn: {
    gap: theme.spacing.xs,
    alignItems: 'flex-start',
  },
  stepChip: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: theme.sizes.timePickerColumnHeight,
  },
  column: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  periodColumn: {
    width: 68,
    gap: theme.spacing.xs,
  },
  columnHeader: {
    textAlign: 'center',
  },
  scrollColumn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  scrollColumnContent: {
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  itemPressable: {
    height: theme.sizes.timePickerItemHeight,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  periodContainer: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  periodPill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.touchTarget,
  },
  periodPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  footerButton: {
    flex: 1,
  },
}));
