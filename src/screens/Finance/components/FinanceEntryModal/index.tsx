import { useState, type ReactElement } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button, Icon, InlineSegmentedControl, Switch, Text, type IconName } from '@/components';
import type { SegmentedOption } from '@/components/InlineSegmentedControl';
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
  SHIFT_PILL_FILL_ALPHA,
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

interface CategoryChoice {
  readonly label: string;
  readonly value: FinanceRuleType;
  readonly icon: IconName;
  readonly accessibilityLabel: string;
}

const CATEGORIES: readonly CategoryChoice[] = [
  { label: 'Tax', value: 'tax', icon: 'percent', accessibilityLabel: 'Tax category' },
  { label: 'Send Home', value: 'remittance', icon: 'send', accessibilityLabel: 'Send Home category' },
  { label: 'Bill / Cost', value: 'expense', icon: 'credit-card', accessibilityLabel: 'Bill or cost category' },
  { label: 'Savings', value: 'savings', icon: 'shield', accessibilityLabel: 'Savings category' },
];

const MODE_OPTIONS: readonly SegmentedOption<FinanceValueMode>[] = [
  { label: 'Fixed ($)', value: 'fixed', accessibilityLabel: 'Fixed dollar amount' },
  { label: 'Percent (%)', value: 'percentage', accessibilityLabel: 'Percentage of gross earnings' },
];

const FEATHER_ICONS: readonly IconName[] = [
  'percent',
  'send',
  'home',
  'zap',
  'shopping-bag',
  'wifi',
  'heart',
  'shield',
  'briefcase',
  'credit-card',
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
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState<boolean>(false);

  const savedTemplates = useFinanceStore(selectFinanceTemplates);
  const templateList: ReadonlyArray<FinanceTemplate | Omit<FinanceTemplate, 'id'>> =
    savedTemplates.length > 0 ? savedTemplates : DEFAULT_FINANCE_TEMPLATES;

  const isEditing = initialEntry !== null && initialEntry !== undefined;
  const parsedValue = Math.max(0, parseFloat(value) || 0);
  const computedAmount =
    valueMode === 'percentage'
      ? Math.round(((currentEffectiveGross * parsedValue) / 100) * 100) / 100
      : parsedValue;
  const projectedBalanceAfter = currentRemainingBalance - computedAmount;
  const resolvedColor = resolveShiftColor(color, theme.mode);

  const handleSelectTemplate = (tpl: FinanceTemplate | Omit<FinanceTemplate, 'id'>): void => {
    haptics.selection();
    setName(tpl.name);
    setCategory(tpl.category);
    setValueMode(tpl.valueMode);
    setValue(String(tpl.value));
    setIcon(tpl.icon);
    setColor(tpl.color);
  };

  const handleSelectCategory = (cat: FinanceRuleType): void => {
    haptics.selection();
    setCategory(cat);
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
      saveAsTemplate,
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss modal">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Header Row */}
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
              <Icon name="x" size={20} tone="muted" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick-Fill Templates Strip (new items only) */}
            {!isEditing ? (
              <View style={styles.quickFillSection}>
                <Text variant="caption" tone="muted" weight="semibold" style={styles.fieldLabel}>
                  QUICK FILL TEMPLATES
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stripRow}
                >
                  {templateList.map((tpl) => (
                    <Pressable
                      key={tpl.name}
                      accessibilityRole="button"
                      accessibilityLabel={`Quick fill ${tpl.name}`}
                      onPress={() => handleSelectTemplate(tpl)}
                      style={styles.templatePill}
                    >
                      <Icon name={tpl.icon as IconName} size={16} tone="accent" />
                      <Text variant="caption" weight="regular">
                        {tpl.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Category Selector (Ergonomic 2x2 Grid) */}
            <View style={styles.sectionBlock}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.fieldLabel}>
                CATEGORY
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      accessibilityRole="button"
                      accessibilityLabel={cat.accessibilityLabel}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectCategory(cat.value)}
                      style={({ pressed }) => [
                        styles.categoryTile,
                        isSelected && styles.categoryTileSelected,
                        pressed && styles.pressed,
                      ]}
                      hitSlop={styles.hitSlop}
                    >
                      <Icon
                        name={cat.icon}
                        size={18}
                        tone={isSelected ? 'accent' : 'muted'}
                      />
                      <Text
                        variant="bodySmall"
                        weight={isSelected ? 'semibold' : 'regular'}
                        tone={isSelected ? 'text' : 'muted'}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Amount & Mode Selector */}
            <View style={styles.sectionBlock}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.fieldLabel}>
                AMOUNT & MODE
              </Text>
              <View style={styles.amountCard}>
                <View style={styles.amountInputRow}>
                  <Text variant="title" weight="semibold" tone="muted">
                    {valueMode === 'percentage' ? '%' : '$'}
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={setValue}
                    accessibilityLabel="Item amount"
                  />
                </View>
                <View style={styles.modeToggleContainer}>
                  <InlineSegmentedControl
                    options={MODE_OPTIONS}
                    value={valueMode}
                    onChange={setValueMode}
                    accessibilityLabel="Value mode"
                  />
                </View>
              </View>
            </View>

            {/* Item Name Input */}
            <View style={styles.sectionBlock}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.fieldLabel}>
                ITEM NAME
              </Text>
              <View style={styles.nameCard}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="e.g. Rent, Groceries, State Tax"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Item name"
                />
              </View>
            </View>

            {/* Live Impact Preview Banner */}
            <View style={styles.previewBanner}>
              <View
                style={[
                  styles.previewBadge,
                  { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                ]}
              >
                <Icon name={icon as IconName} size={20} color={resolvedColor} />
              </View>
              <View style={styles.previewTexts}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  {name.trim().length > 0 ? name.trim() : 'New Item'}
                </Text>
                <Text variant="caption" tone="muted" tabularNums numberOfLines={1}>
                  {valueMode === 'percentage'
                    ? `${parsedValue}% (${formatCurrency(computedAmount)})`
                    : formatCurrency(computedAmount)}{' '}
                  · Balance after: {formatCurrency(projectedBalanceAfter)}
                </Text>
              </View>
            </View>

            {/* Appearance (Color & Icon) Collapsible */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle color and icon picker"
              onPress={() => setAppearanceExpanded((prev) => !prev)}
              style={({ pressed }) => [styles.appearanceRow, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <View style={styles.appearanceRowLeft}>
                <Icon name="edit-3" size={16} tone="muted" />
                <Text variant="bodySmall" weight="semibold">
                  Appearance (Color & Icon)
                </Text>
              </View>
              <Icon
                name={appearanceExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                tone="muted"
              />
            </Pressable>

            {appearanceExpanded ? (
              <View style={styles.appearancePanel}>
                {/* Color Swatches */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stripRow}
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

                {/* Feather Icon Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stripRow}
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
                        <Icon name={ic} size={20} tone={isSelected ? 'accent' : 'text'} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Save as Template Toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text variant="bodySmall" weight="semibold">
                  Save as Reusable Template
                </Text>
                <Text variant="caption" tone="muted">
                  Make available across future months
                </Text>
              </View>
              <Switch
                value={saveAsTemplate}
                onValueChange={setSaveAsTemplate}
                accessibilityLabel="Save as reusable template"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.footerRow}>
              <Button label="Save" variant="primary" onPress={handleSave} />
              {isEditing && onDelete !== undefined ? (
                <Button
                  label={isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
                  variant="danger"
                  onPress={handleDelete}
                />
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxHeight: '92%',
  },
  handle: {
    width: theme.sizes.sheetHandleWidth,
    height: theme.sizes.sheetHandleHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  closeButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  quickFillSection: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.xs,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  templatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget + 4,
  },
  categoryTileSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  amountCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 24,
    minHeight: theme.sizes.touchTarget,
  },
  modeToggleContainer: {
    paddingTop: theme.spacing.xs,
  },
  nameCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget + 4,
    justifyContent: 'center',
  },
  nameInput: {
    color: theme.colors.text,
    minHeight: theme.sizes.touchTarget,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  previewBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTexts: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
  },
  appearanceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  appearancePanel: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  swatchTouch: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: theme.sizes.selectedBorder,
    borderColor: theme.colors.accent,
  },
  swatchCircle: {
    width: theme.sizes.dayMarker,
    height: theme.sizes.dayMarker,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
  },
  switchLabelGroup: {
    gap: theme.spacing.xs,
  },
  footerRow: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
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
