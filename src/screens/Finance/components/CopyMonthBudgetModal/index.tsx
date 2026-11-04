import type { ReactElement } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Button, Icon, Text } from '@/components';
import { MONTH_NAMES } from '@/constants';
import { haptics } from '@/services';
import { makeStyles } from '@/theme';

export interface CopyMonthBudgetModalProps {
  readonly visible: boolean;
  readonly currentMonthKey: string;
  readonly previousMonthKey: string;
  readonly pastConfiguredMonths: readonly string[];
  readonly onCopyFromMonth: (sourceMonthKey: string) => void;
  readonly onResetToTemplates: () => void;
  readonly onClose: () => void;
}

function formatMonthKeyLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  const year = parts[0] ?? '';
  const monthNum = parts[1] !== undefined ? Number(parts[1]) : 1;
  const name = MONTH_NAMES[monthNum - 1] ?? '';
  return `${name} ${year}`;
}

export function CopyMonthBudgetModal({
  visible,
  currentMonthKey,
  previousMonthKey,
  pastConfiguredMonths,
  onCopyFromMonth,
  onResetToTemplates,
  onClose,
}: CopyMonthBudgetModalProps): ReactElement {
  const styles = useStyles();

  const prevMonthLabel = formatMonthKeyLabel(previousMonthKey);
  const otherPastMonths = pastConfiguredMonths.filter(
    (m) => m !== currentMonthKey && m !== previousMonthKey,
  );

  const handleCopy = (sourceKey: string): void => {
    haptics.success();
    onCopyFromMonth(sourceKey);
    onClose();
  };

  const handleReset = (): void => {
    haptics.success();
    onResetToTemplates();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss modal">
        <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text variant="title" weight="semibold">
              Copy Budget Structure
            </Text>

            {/* Explaining Helper Note */}
            <View style={styles.helperNote}>
              <Icon name="info" size={16} tone="accent" />
              <Text variant="caption" tone="muted" style={styles.helperNoteText}>
                Copies only your tax rates and expense items. Gross earnings are always calculated fresh from this month's shifts.
              </Text>
            </View>

            {/* 1. Copy from Previous Month */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Copy from previous month ${prevMonthLabel}`}
              onPress={() => handleCopy(previousMonthKey)}
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            >
              <View style={styles.iconBadge}>
                <Icon name="calendar" size={18} tone="accent" />
              </View>
              <View style={styles.actionTexts}>
                <Text variant="body" weight="semibold">
                  Copy from Previous Month
                </Text>
                <Text variant="caption" tone="muted">
                  {prevMonthLabel}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} tone="muted" />
            </Pressable>

            {/* 2. Copy from Any Past Month */}
            <View style={styles.sectionDivider} />
            <Text variant="caption" tone="muted" weight="semibold">
              COPY FROM ANY PAST MONTH
            </Text>
            {otherPastMonths.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripRow}>
                {otherPastMonths.map((m) => {
                  const label = formatMonthKeyLabel(m);
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy structure from ${label}`}
                      onPress={() => handleCopy(m)}
                      style={({ pressed }) => [styles.monthPill, pressed && styles.pressed]}
                    >
                      <Icon name="copy" size={16} tone="muted" />
                      <Text variant="caption" weight="regular">
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text variant="caption" tone="muted">
                No other past configured months found.
              </Text>
            )}

            {/* 3. Reset to Default Templates */}
            <View style={styles.sectionDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset to default templates"
              onPress={handleReset}
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            >
              <View style={styles.iconBadgeSecondary}>
                <Icon name="layers" size={18} tone="secondary" />
              </View>
              <View style={styles.actionTexts}>
                <Text variant="body" weight="semibold">
                  Reset to Default Templates
                </Text>
                <Text variant="caption" tone="muted">
                  Populate from global saved templates
                </Text>
              </View>
              <Icon name="chevron-right" size={16} tone="muted" />
            </Pressable>

            {/* Footer */}
            <View style={styles.footerRow}>
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
  helperNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  helperNoteText: {
    flex: 1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    minHeight: theme.sizes.touchTarget,
  },
  actionTexts: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  iconBadge: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSecondary: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    height: theme.sizes.touchTarget,
  },
  pressed: {
    opacity: 0.7,
  },
  footerRow: {
    marginTop: theme.spacing.xs,
  },
}));
