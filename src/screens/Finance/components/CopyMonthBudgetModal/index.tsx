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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss modal">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Header Row */}
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
              <Icon name="x" size={20} tone="muted" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Info Helper Box */}
            <View style={styles.helperNote}>
              <View style={styles.infoBadge}>
                <Icon name="info" size={16} tone="accent" />
              </View>
              <Text variant="caption" tone="muted" style={styles.helperNoteText}>
                Copies only your tax rates and expense items. Gross earnings are always calculated fresh from this month's shifts.
              </Text>
            </View>

            {/* Grouped Action Card */}
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
                  <Icon name="calendar" size={20} tone="accent" />
                </View>
                <View style={styles.actionTexts}>
                  <Text variant="body" weight="semibold">
                    Copy Previous Month
                  </Text>
                  <Text variant="caption" tone="muted">
                    {`Imports tax rates and bills from ${prevMonthLabel}`}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} tone="muted" />
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
                  <Icon name="layers" size={20} tone="secondary" />
                </View>
                <View style={styles.actionTexts}>
                  <Text variant="body" weight="semibold">
                    Reset to Default Templates
                  </Text>
                  <Text variant="caption" tone="muted">
                    Populate from global saved templates
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} tone="muted" />
              </Pressable>
            </View>

            {/* Other Past Months Strip */}
            {otherPastMonths.length > 0 ? (
              <View style={styles.sectionGroup}>
                <Text variant="caption" tone="muted" weight="semibold" style={styles.sectionLabel}>
                  COPY FROM ANY PAST MONTH
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stripRow}
                >
                  {otherPastMonths.map((m) => {
                    const label = formatMonthKeyLabel(m);
                    return (
                      <Pressable
                        key={m}
                        accessibilityRole="button"
                        accessibilityLabel={`Copy structure from ${label}`}
                        onPress={() => handleCopy(m)}
                        style={({ pressed }) => [styles.monthPill, pressed && styles.pressed]}
                        hitSlop={styles.hitSlop}
                      >
                        <Icon name="calendar" size={16} tone="muted" />
                        <Text variant="caption" weight="regular">
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Cancel Button */}
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxHeight: '90%',
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
  helperNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.accent,
  },
  infoBadge: {
    paddingTop: 1,
  },
  helperNoteText: {
    flex: 1,
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
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
  sectionGroup: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.xs,
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
  },
  footerRow: {
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
