import { useCallback, useRef, useState, type ReactElement } from 'react';
import { Modal, Pressable, View, StyleSheet, ScrollView } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Text, type TextTone } from '@/components/Text';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface SettingsDropdownOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}

export interface SettingsDropdownRowProps<T extends string | number> {
  readonly icon: IconName;
  readonly iconTone?: TextTone;
  readonly title: string;
  readonly subtitle?: string;
  readonly options: readonly SettingsDropdownOption<T>[];
  readonly selectedValue: T;
  readonly onSelect: (value: T) => void;
  readonly accessibilityLabel?: string;
}

export function SettingsDropdownRow<T extends string | number>({
  icon,
  iconTone = 'accent',
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  accessibilityLabel,
}: SettingsDropdownRowProps<T>): ReactElement {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closingRef = useRef(false);

  const handleOpen = useCallback(() => {
    haptics.selection();
    setIsOpen(true);
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsVisible(false);
    // Small delay to let the fade-out CSS transition finish before removing Modal
    setTimeout(() => {
      setIsOpen(false);
      closingRef.current = false;
    }, 180);
  }, []);

  const handleSelectOption = useCallback(
    (value: T) => {
      haptics.selection();
      onSelect(value);
      handleClose();
    },
    [onSelect, handleClose],
  );

  const badgeStyle = iconTone === 'accent' ? styles.badgeAccent : styles.badgeDefault;

  return (
    <View style={styles.container}>
      {/* Row trigger */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ expanded: isOpen }}
        accessibilityHint="Tap to pick an option"
        onPress={handleOpen}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={[styles.badge, badgeStyle]}>
          <Icon name={icon} size={20} tone={iconTone} />
        </View>

        <View style={styles.textContainer}>
          <Text variant="body" weight="semibold">
            {title}
          </Text>
          {subtitle !== undefined && subtitle.length > 0 ? (
            <Text variant="bodySmall" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailing}>
          <Icon name="chevron-down" size={20} tone="accent" />
        </View>
      </Pressable>

      {/* Modal dropdown */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/* Backdrop */}
        <Pressable
          style={[styles.backdrop, isVisible ? styles.backdropVisible : styles.backdropHidden]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close dropdown"
        />

        {/* Floating sheet */}
        <View style={styles.modalContent}>
          <View
            style={[styles.sheet, isVisible ? styles.sheetVisible : styles.sheetHidden]}
            pointerEvents="box-none"
          >
            <View style={styles.sheetHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text variant="body" weight="semibold">
                {title}
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="x" size={20} tone="muted" />
              </Pressable>
            </View>

            {/* Options list */}
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const isSelected = option.value === selectedValue;
                const optionA11yLabel =
                  option.description !== undefined && option.description.length > 0
                    ? `${option.label}, ${option.description}`
                    : option.label;

                return (
                  <Pressable
                    key={String(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={optionA11yLabel}
                    onPress={() => {
                      handleSelectOption(option.value);
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        variant="body"
                        weight={isSelected ? 'semibold' : 'regular'}
                        tone={isSelected ? 'accent' : 'text'}
                      >
                        {option.label}
                      </Text>
                      {option.description !== undefined && option.description.length > 0 ? (
                        <Text variant="bodySmall" tone="muted">
                          {option.description}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.checkSlot}>
                      {isSelected ? <Icon name="check" size={16} tone="accent" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  row: {
    minHeight: theme.sizes.settingsRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  rowPressed: {
    opacity: 0.65,
  },
  badge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeDefault: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal backdrop
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.overlay,
  },
  backdropVisible: {
    opacity: 1,
  },
  backdropHidden: {
    opacity: 0,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  optionsList: {},
  // Floating bottom sheet
  sheet: {
    bottom: theme.spacing.xxxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sheetVisible: {
    opacity: 1,
  },
  sheetHidden: {
    opacity: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderBottomWidth: theme.sizes.hairline,
    borderBottomColor: theme.colors.border,
  },
  // Option items
  optionRow: {
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.accentSoft,
  },
  optionContent: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  checkSlot: {
    width: theme.spacing.xxl,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
}));
