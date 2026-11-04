import type { ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROOT_ROUTES } from '@/constants/routes';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import type { RootStackScreenProps } from '@/navigation/types';
import { selectFinanceTemplates, useFinanceStore } from '@/store';
import { makeStyles } from '@/theme';
import { FinanceTemplateAmountCard } from './components/FinanceTemplateAmountCard';
import { FinanceTemplateAppearanceCard } from './components/FinanceTemplateAppearanceCard';
import { FinanceTemplateDeleteCard } from './components/FinanceTemplateDeleteCard';
import { FinanceTemplateIdentityCard } from './components/FinanceTemplateIdentityCard';
import { FinanceTemplateLivePreview } from './components/FinanceTemplateLivePreview';
import { FinanceTemplateTypePicker } from './components/FinanceTemplateTypePicker';
import { useFinanceTemplateEditor } from './hooks/useFinanceTemplateEditor';

export function FinanceTemplateEditorScreen({
  navigation,
  route,
}: RootStackScreenProps<typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const templateId = route.params?.templateId;
  const isEditing = templateId !== undefined;

  const templates = useFinanceStore(selectFinanceTemplates);
  const existing = templates.find((t) => t.id === templateId);

  const {
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
  } = useFinanceTemplateEditor(existing);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <IconButton
          iconName="chevron-left"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title" weight="semibold">
          {isEditing ? 'Edit Template' : 'New Template'}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FinanceTemplateLivePreview
            name={name}
            category={category}
            valueMode={valueMode}
            value={parsedValue}
            icon={icon}
            color={color}
          />

          <FinanceTemplateTypePicker
            category={category}
            onChangeCategory={(cat) => {
              setCategory(cat);
              if (cat === 'tax') {
                setValueMode('percentage');
              }
            }}
          />

          <FinanceTemplateIdentityCard
            name={name}
            onChangeName={(val) => {
              setName(val);
              if (errors.name) {
                clearError('name');
              }
            }}
            icon={icon}
            error={errors.name}
          />

          <FinanceTemplateAmountCard
            valueMode={valueMode}
            onChangeValueMode={setValueMode}
            value={value}
            onChangeValue={(val) => {
              setValue(val);
              if (errors.amount) {
                clearError('amount');
              }
            }}
            error={errors.amount}
          />

          <FinanceTemplateAppearanceCard
            color={color}
            onChangeColor={setColor}
            icon={icon}
            onChangeIcon={setIcon}
          />

          <View style={styles.actionsContainer}>
            <Button
              label={isEditing ? 'Save Template' : 'Create Template'}
              variant="primary"
              disabled={isSubmitting}
              onPress={() => void handleSave(() => navigation.goBack())}
            />

            {isEditing ? (
              <FinanceTemplateDeleteCard
                onDelete={() => void handleDelete(() => navigation.goBack())}
                isDeleting={isSubmitting}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default FinanceTemplateEditorScreen;

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  topBarSpacer: {
    width: theme.sizes.touchTarget,
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  actionsContainer: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
}));
