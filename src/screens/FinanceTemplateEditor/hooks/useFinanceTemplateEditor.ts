import { useState } from 'react';
import type { FinanceRuleType, FinanceTemplate, FinanceValueMode } from '@/domain';
import { createId, haptics } from '@/services';
import { selectFinanceTemplates, useFinanceStore } from '@/store';
import { DEFAULT_SHIFT_COLOR } from '@/theme';

export interface FormErrors {
  readonly name?: string | undefined;
  readonly amount?: string | undefined;
}

export interface UseFinanceTemplateEditorResult {
  readonly name: string;
  readonly setName: (name: string) => void;
  readonly category: FinanceRuleType;
  readonly setCategory: (category: FinanceRuleType) => void;
  readonly valueMode: FinanceValueMode;
  readonly setValueMode: (mode: FinanceValueMode) => void;
  readonly value: string;
  readonly setValue: (value: string) => void;
  readonly icon: string;
  readonly setIcon: (icon: string) => void;
  readonly color: string;
  readonly setColor: (color: string) => void;
  readonly errors: FormErrors;
  readonly clearError: (field: keyof FormErrors) => void;
  readonly isSubmitting: boolean;
  readonly parsedValue: number;
  readonly handleSave: (onSuccess: () => void) => Promise<void>;
  readonly handleDelete: (onSuccess: () => void) => Promise<void>;
}

export function useFinanceTemplateEditor(existing?: FinanceTemplate): UseFinanceTemplateEditorResult {
  const templates = useFinanceStore(selectFinanceTemplates);

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<FinanceRuleType>(existing?.category ?? 'expense');
  const [valueMode, setValueMode] = useState<FinanceValueMode>(
    existing?.valueMode ?? (existing?.category === 'tax' ? 'percentage' : 'fixed'),
  );
  const [value, setValue] = useState(existing !== undefined ? String(existing.value) : '');
  const [icon, setIcon] = useState(existing?.icon ?? (category === 'tax' ? 'percent' : 'home'));
  const [color, setColor] = useState(
    existing?.color ?? (category === 'tax' ? '#EF4444' : DEFAULT_SHIFT_COLOR),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedValue = Math.max(0, parseFloat(value) || 0);

  const clearError = (field: keyof FormErrors): void => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {
      ...(name.trim().length > 0 ? {} : { name: 'Template name is required' }),
      ...(value.trim().length === 0 || Number.isNaN(Number(value)) || Number(value) < 0
        ? { amount: 'Enter a valid positive amount or percentage' }
        : {}),
    };
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (onSuccess: () => void): Promise<void> => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const template = {
        id: existing !== undefined ? existing.id : createId(),
        name: name.trim(),
        category,
        valueMode,
        value: parsedValue,
        icon,
        color,
        sortOrder: existing?.sortOrder ?? templates.length + 1,
        isActive: existing?.isActive ?? true,
      };

      await useFinanceStore.getState().upsertFinanceTemplate(template);
      haptics.success();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (onSuccess: () => void): Promise<void> => {
    if (existing === undefined) {
      return;
    }
    setIsSubmitting(true);
    try {
      await useFinanceStore.getState().deleteFinanceTemplate(existing.id);
      haptics.warning();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    category,
    setCategory,
    valueMode,
    setValueMode,
    value,
    setValue,
    icon,
    setIcon,
    color,
    setColor,
    errors,
    clearError,
    isSubmitting,
    parsedValue,
    handleSave,
    handleDelete,
  };
}

