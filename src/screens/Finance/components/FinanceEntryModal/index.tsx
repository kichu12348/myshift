import { useState, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Icon, Sheet, Text, type IconName } from '@/components';
import {
  DEFAULT_FINANCE_TEMPLATES,
  type FinanceRuleType,
  type FinanceTemplate,
  type FinanceValueMode,
  type MonthlyFinanceEntry,
} from '@/domain';
import { haptics } from '@/services';
import { selectFinanceTemplates, useFinanceStore } from '@/store';
import {
  DEFAULT_SHIFT_COLOR,
  makeStyles,
  resolveShiftColor,
  shiftColorPresets,
  useTheme,
} from '@/theme';
import { formatCurrency } from '../../types';

export interface FinanceEntryModalProps {
  readonly visible: boolean;
  readonly initialEntry?: MonthlyFinanceEntry | null | undefined;
  readonly initialCategory?: FinanceRuleType | undefined;
  readonly currentEffectiveGross: number;
  readonly currentRemainingBalance: number;
  readonly onSave: (entry: {
    readonly id?: string | undefined;
    readonly name: string;
    readonly category: FinanceRuleType;
    readonly valueMode: FinanceValueMode;
    readonly value: number;
    readonly icon: string;
    readonly color: string;
    readonly saveAsTemplate: boolean;
  }) => void;
  readonly onDelete?: ((id: string) => void) | undefined;
  readonly onClose: () => void;
}

interface TypeSegment {
  readonly label: string;
  readonly value: FinanceRuleType;
  readonly icon: IconName;
  readonly defaultIcon: string;
}

const TYPE_SEGMENTS: readonly TypeSegment[] = [
  { label: 'Tax', value: 'tax', icon: 'percent', defaultIcon: 'percent' },
  { label: 'Bill', value: 'expense', icon: 'home', defaultIcon: 'home' },
  { label: 'Cost', value: 'remittance', icon: 'tag', defaultIcon: 'tag' },
  { label: 'Other', value: 'savings', icon: 'more-horizontal', defaultIcon: 'more-horizontal' },
];

const FEATHER_ICONS: readonly IconName[] = [
  'home',
  'percent',
  'tag',
  'zap',
  'credit-card',
  'shopping-bag',
  'wifi',
  'heart',
  'shield',
  'briefcase',
  'send',
  'more-horizontal',
  'coffee',
  'truck',
  'gift',
];

export function FinanceEntryModal({
  visible,
  initialEntry,
  initialCategory = 'expense',
  currentEffectiveGross,
  currentRemainingBalance,
  onSave,
  onDelete,
  onClose,
}: FinanceEntryModalProps): ReactElement {
  const { theme } = useTheme();
  const styles = useStyles();

  const isEditing = initialEntry !== null && initialEntry !== undefined;

  const [name, setName] = useState<string>(() => initialEntry?.name ?? '');
  const [category, setCategory] = useState<FinanceRuleType>(
    () => initialEntry?.category ?? initialCategory,
  );
  const [valueMode, setValueMode] = useState<FinanceValueMode>(
    () => initialEntry?.valueMode ?? (initialCategory === 'tax' ? 'percentage' : 'fixed'),
  );
  const [value, setValue] = useState<string>(() =>
    initialEntry !== null && initialEntry !== undefined ? String(initialEntry.value) : '',
  );
  const [icon, setIcon] = useState<string>(
    () => initialEntry?.icon ?? (initialCategory === 'tax' ? 'percent' : 'home'),
  );
  const [color, setColor] = useState<string>(
    () => initialEntry?.color ?? (initialCategory === 'tax' ? '#EF4444' : DEFAULT_SHIFT_COLOR),
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState<boolean>(false);

  const savedTemplates = useFinanceStore(selectFinanceTemplates);
  const templateList: ReadonlyArray<FinanceTemplate | Omit<FinanceTemplate, 'id'>> =
    savedTemplates.length > 0 ? savedTemplates : DEFAULT_FINANCE_TEMPLATES;

  const parsedValue = Math.max(0, parseFloat(value) || 0);
  const computedAmount =
    valueMode === 'percentage'
      ? Math.round(((currentEffectiveGross * parsedValue) / 100) * 100) / 100
      : parsedValue;

  const initialComputed =
    isEditing && initialEntry !== null && initialEntry !== undefined
      ? initialEntry.valueMode === 'percentage'
        ? Math.round(((currentEffectiveGross * initialEntry.value) / 100) * 100) / 100
        : initialEntry.value
      : 0;

  const balanceBefore = currentRemainingBalance + initialComputed;
  const projectedBalanceAfter = balanceBefore - computedAmount;

  const formattedBalanceBefore = formatCurrency(balanceBefore);
  const formattedComputedDeduction = formatCurrency(computedAmount);
  const formattedProjectedBalanceAfter = formatCurrency(projectedBalanceAfter);
  const resolvedColor = resolveShiftColor(color, theme.mode);

  const handleSelectType = (seg: TypeSegment): void => {
    haptics.selection();
    setCategory(seg.value);
    if (seg.value === 'tax') {
      setValueMode('percentage');
    }
    if (!isEditing && name.trim().length === 0) {
      setIcon(seg.defaultIcon);
    }
  };

  const handleSelectTemplate = (tpl: FinanceTemplate | Omit<FinanceTemplate, 'id'>): void => {
    haptics.selection();
    setName(tpl.name);
    setCategory(tpl.category);
    setValueMode(tpl.valueMode);
    setValue(String(tpl.value));
    setIcon(tpl.icon);
    setColor(tpl.color);
  };

  const handleSave = (): void => {
    const finalName = name.trim().length > 0 ? name.trim() : 'New Item';
    onSave({
      id: initialEntry?.id,
      name: finalName,
      category,
      valueMode,
      value: parsedValue,
      icon,
      color,
      saveAsTemplate: false,
    });
    onClose();
  };

  const handleDelete = (): void => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    if (initialEntry !== null && initialEntry !== undefined && onDelete !== undefined) {
      onDelete(initialEntry.id);
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} showHandle={true}>
      <View style={styles.contentContainer}>
        {/* 1. Header */}
        <View style={styles.headerRow}>
          <Text variant="title" weight="semibold">
            {isEditing ? 'Edit Allocation' : 'New Allocation'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="x" size={24} tone="text" />
          </Pressable>
        </View>
        <Text variant="bodySmall" tone="muted" style={styles.subtitle}>
          Add a tax, bill or planned cost.
        </Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Fill Templates (new items only) */}
            {!isEditing && templateList.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickFillStrip}
              >
                {templateList.map((tpl) => (
                  <Pressable
                    key={tpl.name}
                    accessibilityRole="button"
                    accessibilityLabel={`Quick fill ${tpl.name}`}
                    onPress={() => handleSelectTemplate(tpl)}
                    style={({ pressed }) => [styles.quickFillPill, pressed && styles.pressed]}
                    hitSlop={styles.hitSlop}
                  >
                    <Icon name={tpl.icon as IconName} size={16} tone="primary" />
                    <Text variant="caption">{tpl.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {/* 2. Type 4-Segment Pill Bar */}
            <View style={styles.sectionBlock}>
              <Text variant="bodySmall" weight="semibold">
                Type
              </Text>
              <View style={styles.typeSegmentContainer}>
                {TYPE_SEGMENTS.map((seg) => {
                  const isSelected = category === seg.value;
                  return (
                    <Pressable
                      key={seg.value}
                      accessibilityRole="button"
                      accessibilityLabel={`${seg.label} type`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectType(seg)}
                      style={[styles.typeSegment, isSelected && styles.typeSegmentSelected]}
                      hitSlop={styles.hitSlop}
                    >
                      <Icon
                        name={seg.icon}
                        size={16}
                        color={isSelected ? theme.colors.onAccent : theme.colors.textMuted}
                      />
                      <Text
                        variant="caption"
                        weight={isSelected ? 'semibold' : 'regular'}
                        style={isSelected ? styles.onAccentText : styles.mutedText}
                      >
                        {seg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3. Name Input Box */}
            <View style={styles.sectionBlock}>
              <Text variant="bodySmall" weight="semibold">
                Name
              </Text>
              <View style={styles.inputBox}>
                <Icon name={icon as IconName} size={18} tone="muted" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rent, Income Tax"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Item name"
                />
              </View>
            </View>

            {/* 4. Amount Section with Inline Fixed | Percent Toggle */}
            <View style={styles.sectionBlock}>
              <View style={styles.amountHeaderRow}>
                <Text variant="bodySmall" weight="semibold">
                  Amount
                </Text>
                <View style={styles.toggleContainer}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fixed amount"
                    accessibilityState={{ selected: valueMode === 'fixed' }}
                    onPress={() => {
                      haptics.selection();
                      setValueMode('fixed');
                    }}
                    style={[styles.togglePill, valueMode === 'fixed' && styles.togglePillSelected]}
                    hitSlop={styles.hitSlop}
                  >
                    <Text
                      variant="caption"
                      weight={valueMode === 'fixed' ? 'semibold' : 'regular'}
                      style={valueMode === 'fixed' ? styles.onAccentText : styles.mutedText}
                    >
                      Fixed
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Percent amount"
                    accessibilityState={{ selected: valueMode === 'percentage' }}
                    onPress={() => {
                      haptics.selection();
                      setValueMode('percentage');
                    }}
                    style={[
                      styles.togglePill,
                      valueMode === 'percentage' && styles.togglePillSelected,
                    ]}
                    hitSlop={styles.hitSlop}
                  >
                    <Text
                      variant="caption"
                      weight={valueMode === 'percentage' ? 'semibold' : 'regular'}
                      style={valueMode === 'percentage' ? styles.onAccentText : styles.mutedText}
                    >
                      Percent
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputBox}>
                <Text variant="title" tone="muted">
                  {valueMode === 'percentage' ? '%' : '$'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.amountTextInput]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={setValue}
                  accessibilityLabel="Item amount"
                />
              </View>
            </View>

            {/* 5. Live Balance after Preview Card */}
            <View style={styles.balanceAfterCard}>
              <View style={styles.balanceAfterLeft}>
                <Icon name="credit-card" size={20} color={theme.colors.success} />
                <View style={styles.balanceAfterTexts}>
                  <Text variant="caption" tone="muted">
                    Balance after
                  </Text>
                  <Text
                    variant="title"
                    weight="semibold"
                    tone={projectedBalanceAfter < 0 ? 'danger' : undefined}
                    style={projectedBalanceAfter >= 0 ? styles.successText : undefined}
                    tabularNums
                  >
                    {formattedProjectedBalanceAfter}
                  </Text>
                </View>
              </View>
              <Text variant="caption" tone="muted" tabularNums style={styles.equationText}>
                {`${formattedBalanceBefore} - ${formattedComputedDeduction}`}
              </Text>
            </View>

            {/* 6. Appearance Section (2 Separate Rounded Row Cards) */}
            <View style={styles.sectionBlock}>
              <Text variant="bodySmall" weight="semibold">
                Appearance
              </Text>

              {/* Card Row 1: Icon & Color */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle color and icon picker"
                onPress={() => setAppearanceExpanded((prev) => !prev)}
                style={({ pressed }) => [styles.appearanceCard, pressed && styles.pressed]}
                hitSlop={styles.hitSlop}
              >
                <View style={styles.appearanceLeft}>
                  <Icon name={icon as IconName} size={18} tone="muted" />
                  <Text variant="body">Icon & Color</Text>
                </View>
                <View style={styles.appearanceRight}>
                  <View style={[styles.colorDot, { backgroundColor: resolvedColor }]} />
                  <Icon
                    name={appearanceExpanded ? 'chevron-down' : 'chevron-right'}
                    size={16}
                    tone="muted"
                  />
                </View>
              </Pressable>

              {/* Expanded Inline Picker Strip */}
              {appearanceExpanded ? (
                <View style={styles.pickerStripContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pickerRow}
                  >
                    {shiftColorPresets.map((preset) => {
                      const isSelected = preset.light.toLowerCase() === color.toLowerCase();
                      const swatchBg = resolveShiftColor(preset.light, theme.mode);
                      return (
                        <Pressable
                          key={preset.name}
                          accessibilityRole="button"
                          accessibilityLabel={`Color ${preset.name}`}
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setColor(preset.light)}
                          style={[styles.swatchTouch, isSelected && styles.swatchSelected]}
                          hitSlop={styles.hitSlop}
                        >
                          <View style={[styles.swatchCircle, { backgroundColor: swatchBg }]}>
                            {isSelected ? <Icon name="check" size={16} tone="onAccent" /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pickerRow}
                  >
                    {FEATHER_ICONS.map((ic) => {
                      const isSelected = ic === icon;
                      return (
                        <Pressable
                          key={ic}
                          accessibilityRole="button"
                          accessibilityLabel={`Icon ${ic}`}
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setIcon(ic)}
                          style={[styles.iconButton, isSelected && styles.iconButtonSelected]}
                          hitSlop={styles.hitSlop}
                        >
                          <Icon name={ic} size={18} tone={isSelected ? 'accent' : 'muted'} />
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            {/* 7. Bottom Full-Width CTA Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save Changes' : 'Add Allocation'}
              onPress={handleSave}
              style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            >
              <Text variant="body" weight="semibold" tone="onAccent">
                {isEditing ? 'Save Changes' : 'Add Allocation'}
              </Text>
            </Pressable>

            {isEditing && onDelete !== undefined ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
                onPress={handleDelete}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              >
                <Text variant="bodySmall" weight="semibold" tone="danger">
                  {isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((theme) => ({
  contentContainer: {
    flex: 1,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sheetScroll: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: -theme.spacing.sm,
  },
  quickFillStrip: {
    gap: theme.spacing.xs,
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  typeSegmentContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.pillPaddingCompact,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeSegment: {
    flex: 1,
    height: theme.sizes.typeSegmentHeight,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  typeSegmentSelected: {
    backgroundColor: theme.colors.primary,
  },
  onAccentText: {
    color: theme.colors.onAccent,
  },
  mutedText: {
    color: theme.colors.textMuted,
  },
  inputBox: {
    height: theme.sizes.inputBoxHeight,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  amountTextInput: {
    fontSize: theme.typography.size.title,
    fontWeight: '600',
    fontVariant: theme.typography.fontVariant.tabularNums,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.sizes.segmentedTrackPadding,
    flexDirection: 'row',
  },
  togglePill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillSelected: {
    backgroundColor: theme.colors.primary,
  },
  balanceAfterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAfterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  balanceAfterTexts: {
    gap: theme.spacing.xs,
  },
  successText: {
    color: theme.colors.success,
  },
  equationText: {
    alignSelf: 'flex-end',
  },
  appearanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.sizes.touchTarget,
  },
  appearanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  appearanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  colorDot: {
    width: theme.sizes.colorDotPreviewSize,
    height: theme.sizes.colorDotPreviewSize,
    borderRadius: theme.radius.full,
  },
  pickerStripContainer: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  pickerRow: {
    gap: theme.spacing.xs,
  },
  swatchTouch: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  swatchSelected: {
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
  },
  swatchCircle: {
    width: theme.sizes.colorSwatchSize,
    height: theme.sizes.colorSwatchSize,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: theme.sizes.iconOptionSize,
    height: theme.sizes.iconOptionSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  iconButtonSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderWidth: theme.sizes.size1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
}));
