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

const CATEGORY_OPTIONS: readonly SegmentedOption<FinanceRuleType>[] = [
  { label: 'Tax', value: 'tax', accessibilityLabel: 'Tax category' },
  { label: 'Send Home', value: 'remittance', accessibilityLabel: 'Send Home category' },
  { label: 'Bill / Cost', value: 'expense', accessibilityLabel: 'Bill or cost category' },
  { label: 'Savings', value: 'savings', accessibilityLabel: 'Savings category' },
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

  const savedTemplates = useFinanceStore(selectFinanceTemplates);
  const templateList: ReadonlyArray<FinanceTemplate | Omit<FinanceTemplate, 'id'>> =
    savedTemplates.length > 0 ? savedTemplates : DEFAULT_FINANCE_TEMPLATES;

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss modal">
        <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Live Preview Banner */}
            <View style={styles.previewBanner}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${resolvedColor}${SHIFT_PILL_FILL_ALPHA}` },
                ]}
              >
                <Icon name={icon as IconName} size={20} color={resolvedColor} />
              </View>
              <View style={styles.previewTexts}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  {name.trim().length > 0 ? name.trim() : 'New Item'}
                </Text>
                <Text variant="caption" tone="muted" tabularNums>
                  {valueMode === 'percentage'
                    ? `${parsedValue}% (${formatCurrency(computedAmount)})`
                    : formatCurrency(computedAmount)}{' '}
                  · Balance after: {formatCurrency(projectedBalanceAfter)}
                </Text>
              </View>
            </View>

            {/* 2. Category Selector */}
            <InlineSegmentedControl
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
              accessibilityLabel="Category"
            />

            {/* 3. Name & Amount Inputs */}
            <TextInput
              style={styles.input}
              placeholder="Item name (e.g. Rent, Tax)"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Item name"
            />

            <InlineSegmentedControl
              options={MODE_OPTIONS}
              value={valueMode}
              onChange={setValueMode}
              accessibilityLabel="Value mode"
            />

            <View style={styles.amountInputWrapper}>
              <Text variant="body" weight="semibold" tone="muted">
                {valueMode === 'fixed' ? '$' : '%'}
              </Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder={valueMode === 'fixed' ? '0.00' : '0'}
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={setValue}
                accessibilityLabel="Item amount"
              />
            </View>

            {/* 4. Quick-Fill from Saved Templates */}
            <Text variant="caption" tone="muted" weight="semibold">
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
                  <Icon name={tpl.icon as IconName} size={16} tone="muted" />
                  <Text variant="caption" weight="regular">
                    {tpl.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 5. Color Swatch & Feather Icon Strip */}
            <Text variant="caption" tone="muted" weight="semibold">
              COLOR & ICON
            </Text>
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
                  >
                    <Icon name={ic} size={18} tone={isSelected ? 'accent' : 'text'} />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 6. Save as Reusable Template Toggle */}
            <View style={styles.switchRow}>
              <Text variant="bodySmall">Save as Reusable Template</Text>
              <Switch
                value={saveAsTemplate}
                onValueChange={setSaveAsTemplate}
                accessibilityLabel="Save as reusable template"
              />
            </View>

            {/* 7. Footer Actions */}
            <View style={styles.footerRow}>
              <Button label="Save" variant="primary" onPress={handleSave} />
              {initialEntry !== null && initialEntry !== undefined && onDelete !== undefined ? (
                <Button
                  label={isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
                  variant="danger"
                  onPress={handleDelete}
                />
              ) : null}
              <Button label="Cancel" variant="secondary" onPress={onClose} />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  dialogCard: {
    width: '100%',
    maxWidth: theme.sizes.timeModalMaxWidth,
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  badge: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTexts: { flex: 1, gap: theme.spacing.xs },
  input: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    color: theme.colors.text,
    minHeight: theme.sizes.touchTarget,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
    minHeight: theme.sizes.touchTarget,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
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
    padding: theme.spacing.sm,
  },
  swatchTouch: {
    width: theme.sizes.colorSwatchSize,
    height: theme.sizes.colorSwatchSize,
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
    backgroundColor: theme.colors.surfaceRaised,
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
    paddingVertical: theme.spacing.xs,
  },
  footerRow: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
}));
