import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { minutesToTimeParts, timeToMinutes12, timeToMinutes24 } from '@/domain';
import { Text } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles, useTheme } from '@/theme';

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
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

type ScrollViewInstance = React.ComponentRef<typeof ScrollView>;

interface DrumColumnProps {
  readonly title: string;
  readonly items: readonly number[];
  readonly selectedItem: number;
  readonly formatLabel: (val: number) => string;
  readonly accessibilityPrefix: string;
  readonly onSelect: (val: number) => void;
  readonly scrollRef: React.RefObject<ScrollViewInstance | null>;
  readonly initialIndex: number;
  readonly styles: ReturnType<typeof useStyles>;
  readonly itemHeight: number;
}

function DrumColumn({
  title,
  items,
  selectedItem,
  formatLabel,
  accessibilityPrefix,
  onSelect,
  scrollRef,
  initialIndex,
  styles,
  itemHeight,
}: DrumColumnProps): ReactElement {
  const count = items.length;
  const initialOffset = (initialIndex + count) * itemHeight;

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const y = e.nativeEvent.contentOffset.y;
    const rawIndex = Math.round(y / itemHeight);
    const normalizedIndex = ((rawIndex % count) + count) % count;
    const val = items[normalizedIndex];
    if (val !== undefined && val !== selectedItem) {
      haptics.selection();
      onSelect(val);
    }
    if (rawIndex < count || rawIndex >= 2 * count) {
      scrollRef.current?.scrollTo({
        y: (normalizedIndex + count) * itemHeight,
        animated: false,
      });
    }
  };

  const handleItemPress = (cycleIndex: number, val: number): void => {
    haptics.selection();
    onSelect(val);
    scrollRef.current?.scrollTo({
      y: cycleIndex * itemHeight,
      animated: true,
    });
  };

  const tripleItems = [items, items, items];

  return (
    <View style={styles.column}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.columnHeader}>
        {title}
      </Text>
      <View style={styles.scrollWrapper}>
        <View style={styles.selectionLens} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: initialOffset }}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.scrollColumn}
          contentContainerStyle={styles.scrollColumnContent}
        >
          {tripleItems.flatMap((cycleItems, cycleIdx) =>
            cycleItems.map((item, itemIdx) => {
              const absoluteIdx = cycleIdx * count + itemIdx;
              const isSelected = selectedItem === item;
              const label = formatLabel(item);
              const isMiddleCycle = cycleIdx === 1;

              return (
                <Pressable
                  key={`${cycleIdx}-${item}`}
                  accessibilityRole={isMiddleCycle ? 'button' : undefined}
                  accessibilityLabel={isMiddleCycle ? `${accessibilityPrefix} ${label}` : undefined}
                  accessibilityState={isMiddleCycle ? { selected: isSelected } : undefined}
                  accessibilityElementsHidden={!isMiddleCycle}
                  importantForAccessibility={isMiddleCycle ? 'yes' : 'no-hide-descendants'}
                  onPress={() => handleItemPress(absoluteIdx, item)}
                  style={styles.itemPressable}
                >
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'regular'}
                    tone={isSelected ? 'accent' : 'muted'}
                    tabularNums
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            }),
          )}
        </ScrollView>
      </View>
    </View>
  );
}

export function TimePickerModal({
  visible,
  title,
  initialMinutes,
  timeFormat,
  onConfirm,
  onClose,
}: TimePickerModalProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const parts = minutesToTimeParts(initialMinutes, timeFormat);
  const [selectedHour, setSelectedHour] = useState(parts.hour);
  const [selectedMinute, setSelectedMinute] = useState(parts.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parts.period);

  const hourScrollRef = useRef<ScrollViewInstance | null>(null);
  const minuteScrollRef = useRef<ScrollViewInstance | null>(null);

  const hoursList = timeFormat === '12h' ? HOURS_12 : HOURS_24;
  const initialHourIndex =
    timeFormat === '12h'
      ? Math.max(0, HOURS_12.indexOf(parts.hour as (typeof HOURS_12)[number]))
      : parts.hour;

  useEffect(() => {
    if (visible) {
      const p = minutesToTimeParts(initialMinutes, timeFormat);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);

      const hIdx =
        timeFormat === '12h'
          ? Math.max(0, HOURS_12.indexOf(p.hour as (typeof HOURS_12)[number]))
          : p.hour;
      const hOffset = (hIdx + hoursList.length) * theme.sizes.timePickerItemHeight;
      const mOffset = (p.minute + MINUTES_60.length) * theme.sizes.timePickerItemHeight;

      hourScrollRef.current?.scrollTo({ y: hOffset, animated: false });
      minuteScrollRef.current?.scrollTo({ y: mOffset, animated: false });
    }
  }, [visible, initialMinutes, timeFormat, hoursList.length, theme.sizes.timePickerItemHeight]);

  const computedMinutes =
    timeFormat === '12h'
      ? timeToMinutes12(selectedHour, selectedMinute, selectedPeriod)
      : timeToMinutes24(selectedHour, selectedMinute);

  const formattedHour = String(selectedHour).padStart(2, '0');
  const formattedMinute = String(selectedMinute).padStart(2, '0');

  const handleSelectHour = (hour: number): void => {
    setSelectedHour(hour);
  };

  const handleSelectMinute = (min: number): void => {
    setSelectedMinute(min);
  };

  const handleSelectPeriod = (period: 'AM' | 'PM'): void => {
    haptics.selection();
    setSelectedPeriod(period);
  };

  const handleDone = (): void => {
    haptics.success();
    onConfirm(computedMinutes);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close time picker"
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.dialogCard}>
          {/* Zone 1 — Top Label */}
          <View style={styles.headerRow}>
            <Text variant="caption" tone="muted" weight="semibold" style={styles.headerTitle}>
              {title.toUpperCase()}
            </Text>
          </View>

          {/* Zone 2 — Hero Digital Readout Row */}
          <View style={styles.readoutRow}>
            <View
              accessibilityLabel={`Selected hour ${formattedHour}`}
              style={styles.hourDisplayBox}
            >
              <Text variant="display" weight="semibold" tone="accent" tabularNums>
                {formattedHour}
              </Text>
            </View>

            <Text variant="display" weight="semibold" tone="muted">
              :
            </Text>

            <View
              accessibilityLabel={`Selected minute ${formattedMinute}`}
              style={styles.minuteDisplayBox}
            >
              <Text variant="display" weight="semibold" tabularNums>
                {formattedMinute}
              </Text>
            </View>

            {timeFormat === '12h' ? (
              <View style={styles.periodSelector}>
                {PERIODS.map((p) => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <Pressable
                      key={p}
                      accessibilityRole="button"
                      accessibilityLabel={`Period ${p}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectPeriod(p)}
                      style={[styles.periodButton, isSelected && styles.periodButtonActive]}
                    >
                      <Text
                        variant="caption"
                        weight="semibold"
                        tone={isSelected ? 'onAccent' : 'muted'}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          {/* Zone 3 — Apple Circular Wheel Drums */}
          <View style={styles.drumsContainer}>
            <DrumColumn
              title="HOUR"
              items={hoursList}
              selectedItem={selectedHour}
              formatLabel={(h) => (timeFormat === '24h' ? String(h).padStart(2, '0') : String(h))}
              accessibilityPrefix="Hour"
              onSelect={handleSelectHour}
              scrollRef={hourScrollRef}
              initialIndex={initialHourIndex}
              styles={styles}
              itemHeight={theme.sizes.timePickerItemHeight}
            />
            <DrumColumn
              title="MINUTE"
              items={MINUTES_60}
              selectedItem={selectedMinute}
              formatLabel={(m) => String(m).padStart(2, '0')}
              accessibilityPrefix="Minute"
              onSelect={handleSelectMinute}
              scrollRef={minuteScrollRef}
              initialIndex={parts.minute}
              styles={styles}
              itemHeight={theme.sizes.timePickerItemHeight}
            />
          </View>

          {/* Zone 4 — Action Footer Row */}
          <View style={styles.footerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text variant="body" weight="semibold" tone="muted">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={handleDone}
              style={styles.doneButton}
            >
              <Text variant="body" weight="semibold" tone="onAccent">
                Done
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: theme.sizes.timeModalMaxWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  headerTitle: {
    letterSpacing: 0.8,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  hourDisplayBox: {
    width: theme.sizes.timeDisplayBoxWidth,
    height: theme.sizes.timeDisplayBoxHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteDisplayBox: {
    width: theme.sizes.timeDisplayBoxWidth,
    height: theme.sizes.timeDisplayBoxHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    height: theme.sizes.timeDisplayBoxHeight,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    height: theme.sizes.periodButtonHeight,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  drumsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  column: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  columnHeader: {
    textAlign: 'center',
  },
  scrollWrapper: {
    height: theme.sizes.timePickerColumnHeight,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  selectionLens: {
    position: 'absolute',
    top: theme.sizes.timePickerWheelPadding,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
    height: theme.sizes.timePickerLensHeight,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.sm,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  scrollColumn: {
    flex: 1,
  },
  scrollColumnContent: {
    paddingVertical: theme.sizes.timePickerWheelPadding,
  },
  itemPressable: {
    height: theme.sizes.timePickerItemHeight,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  doneButton: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
