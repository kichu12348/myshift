import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROOT_ROUTES } from '@/constants/routes';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { getYearMonth } from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackScreenProps } from '@/navigation/types';
import { haptics } from '@/services';
import { selectFinanceTemplates, useFinanceStore } from '@/store';
import { makeStyles } from '@/theme';
import { FinanceTemplateRow } from './components/FinanceTemplateRow';

export function FinanceTemplateListScreen({
  navigation,
}: RootStackScreenProps<typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST>): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const today = useToday();
  const [isApplying, setIsApplying] = useState(false);

  const templates = useFinanceStore(selectFinanceTemplates);

  useEffect(() => {
    if (templates.length === 0) {
      void useFinanceStore.getState().loadTemplates(true);
    }
  }, [templates.length]);

  const taxTemplates = useMemo(() => templates.filter((t) => t.category === 'tax'), [templates]);

  const allocationTemplates = useMemo(
    () => templates.filter((t) => t.category !== 'tax'),
    [templates],
  );

  const currentMonthKey = useMemo(() => {
    const ym = getYearMonth(today);
    return `${ym.year}-${String(ym.month).padStart(2, '0')}`;
  }, [today]);

  const handleApplyTemplates = async (): Promise<void> => {
    setIsApplying(true);
    try {
      haptics.success();
      await useFinanceStore.getState().resetMonthToDefaultTemplates(currentMonthKey);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
          />
          <Text variant="title" weight="semibold">
            Finance Templates
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add finance template"
          onPress={() => navigation.navigate(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {})}
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          hitSlop={styles.hitSlop}
        >
          <Icon name="plus" size={16} tone="onAccent" />
          <Text variant="bodySmall" weight="semibold" tone="onAccent">
            New
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodySmall" tone="muted">
              No finance templates configured
            </Text>
            <Button
              label="Create First Template"
              variant="secondary"
              onPress={() => navigation.navigate(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {})}
            />
          </View>
        ) : (
          <>
            {taxTemplates.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="caption" tone="muted" weight="semibold">
                    {`TAXES (${taxTemplates.length})`}
                  </Text>
                </View>
                <View style={styles.card}>
                  {taxTemplates.map((template, index) => (
                    <View key={template.id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <FinanceTemplateRow
                        template={template}
                        onPress={() =>
                          navigation.navigate(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {
                            templateId: template.id,
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {allocationTemplates.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="caption" tone="muted" weight="semibold">
                    {`RECURRING ALLOCATIONS (${allocationTemplates.length})`}
                  </Text>
                </View>
                <View style={styles.card}>
                  {allocationTemplates.map((template, index) => (
                    <View key={template.id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <FinanceTemplateRow
                        template={template}
                        onPress={() =>
                          navigation.navigate(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {
                            templateId: template.id,
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.applyButtonContainer}>
              <Button
                label={isApplying ? 'Applying...' : 'Apply Templates to Current Month'}
                variant="secondary"
                disabled={isApplying}
                onPress={() => void handleApplyTemplates()}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default FinanceTemplateListScreen;

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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  newButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  newButtonPressed: {
    opacity: 0.8,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  applyButtonContainer: {
    marginTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
}));
