import type { ReactElement } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Icon, Text } from '@/components';
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
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss modal"
      >
        <Pressable
          style={styles.dialogCard}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text variant="title" weight="semibold">
              Copy Budget Structure
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="x" size={20} tone="text" />
            </Pressable>
          </View>

          <Text variant="bodySmall" tone="muted" style={styles.subtitle}>
            Copies only your tax rates and expense items. Gross earnings are always calculated fresh from this month's shifts.
          </Text>

          {/* Grouped Options Card */}
          <View style={styles.card}>
            {/* Copy Previous Month Row */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Copy from previous month ${prevMonthLabel}`}
              onPress={() => handleCopy(previousMonthKey)}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <View style={styles.iconBadge}>
                <Icon name="calendar" size={18} tone="accent" />
              </View>
              <View style={styles.actionTexts}>
                <Text variant="body" weight="semibold">
                  Copy Previous Month
                </Text>
                <Text variant="caption" tone="muted">
                  {`Imports tax rates and bills from ${prevMonthLabel}`}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} tone="muted" />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Reset to Default Templates Row */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset to default templates"
              onPress={handleReset}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <View style={styles.iconBadgeSecondary}>
                <Icon name="layers" size={18} tone="muted" />
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
          </View>

          {/* Other Past Months Section */}
          {otherPastMonths.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text variant="bodySmall" weight="semibold">
                Past Months
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickFillStrip}
              >
                {otherPastMonths.map((m) => {
                  const label = formatMonthKeyLabel(m);
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy structure from ${label}`}
                      onPress={() => handleCopy(m)}
                      style={({ pressed }) => [styles.quickFillPill, pressed && styles.pressed]}
                      hitSlop={styles.hitSlop}
                    >
                      <Icon name="calendar" size={16} tone="muted" />
                      <Text variant="caption">{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Cancel Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text variant="bodySmall" weight="semibold" tone="muted">
              Cancel
            </Text>
          </Pressable>
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
    maxWidth: theme.sizes.calendarModalMaxWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
    marginTop: -theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: theme.sizes.settingsRowMinHeight,
  },
  iconBadge: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSecondary: {
    width: theme.sizes.settingsBadgeSize,
    height: theme.sizes.settingsBadgeSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rowDivider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  quickFillStrip: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
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
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
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
