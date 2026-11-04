import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatDurationHoursMinutes } from '@/domain';
import { makeStyles } from '@/theme';
import { formatCurrency, formatDayOrdinal } from '../../types';
import { GrossPayEditModal } from '../GrossPayEditModal';
import { PaydayCutoffModal } from '../PaydayCutoffModal';

export interface GrossPayHeroCardProps {
  readonly effectiveGrossPay: number;
  readonly autoGrossPay: number;
  readonly isManualGrossOverride: boolean;
  readonly paydayDayOfMonth: number;
  readonly workingShiftCount: number;
  readonly totalNetMinutes: number;
  readonly onSaveGrossOverride: (amount: number) => void;
  readonly onSyncFromShifts: () => void;
  readonly onSavePaydayCutoff: (day: number) => void;
  readonly onNavigateTemplates?: (() => void) | undefined;
}

export function GrossPayHeroCard({
  effectiveGrossPay,
  autoGrossPay,
  isManualGrossOverride,
  paydayDayOfMonth,
  workingShiftCount,
  totalNetMinutes,
  onSaveGrossOverride,
  onSyncFromShifts,
  onSavePaydayCutoff,
  onNavigateTemplates,
}: GrossPayHeroCardProps): ReactElement {
  const styles = useStyles();
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState<boolean>(false);

  const formattedGrossPay = formatCurrency(effectiveGrossPay);
  const cutoffLabel = `Cutoff: ${formatDayOrdinal(paydayDayOfMonth)}`;
  const formattedHours = formatDurationHoursMinutes(totalNetMinutes);
  const shiftsCountedLabel = `Shifts counted: ${workingShiftCount} · ${formattedHours}`;

  return (
    <View style={styles.card}>
      {/* Top Row: Squircle icon, labels, giant value, edit pill */}
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={styles.badge}>
            <Icon name="dollar-sign" size={20} tone="accent" />
          </View>
          <View style={styles.labelStack}>
            <View style={styles.headerLabelRow}>
              <Text variant="caption" tone="muted" weight="semibold" style={styles.labelTracking}>
                GROSS EARNINGS
              </Text>
              <View style={styles.statusBadge}>
                <Text
                  variant="caption"
                  weight="semibold"
                  tone={isManualGrossOverride ? 'warning' : 'accent'}
                >
                  {isManualGrossOverride ? 'Manual Override' : 'Auto from Shifts'}
                </Text>
              </View>
            </View>
            <Text variant="display" weight="semibold" tabularNums>
              {formattedGrossPay}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit gross earnings"
          onPress={() => setIsEditModalOpen(true)}
          style={({ pressed }) => [styles.pillButton, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Icon name="edit-2" size={16} tone="muted" />
          <Text variant="caption" weight="semibold" tone="muted">
            Edit Gross
          </Text>
        </Pressable>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* Bottom Payday & Net Strip */}
      <View style={styles.bottomStrip}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change payday cutoff, current ${cutoffLabel}`}
          onPress={() => setIsCutoffModalOpen(true)}
          style={({ pressed }) => [styles.pillButton, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Icon name="calendar" size={16} tone="muted" />
          <Text variant="caption" weight="semibold" tone="secondary" tabularNums>
            {cutoffLabel}
          </Text>
        </Pressable>

        <Text variant="caption" tone="muted" tabularNums>
          {shiftsCountedLabel}
        </Text>
      </View>

      <GrossPayEditModal
        visible={isEditModalOpen}
        currentGross={effectiveGrossPay}
        isManualOverride={isManualGrossOverride}
        autoGrossPay={autoGrossPay}
        onSaveOverride={onSaveGrossOverride}
        onSyncFromShifts={onSyncFromShifts}
        onNavigateTemplates={onNavigateTemplates}
        onClose={() => setIsEditModalOpen(false)}
      />

      <PaydayCutoffModal
        visible={isCutoffModalOpen}
        selectedDay={paydayDayOfMonth}
        onSelectDay={onSavePaydayCutoff}
        onClose={() => setIsCutoffModalOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  badge: {
    width: theme.sizes.iconBadge,
    height: theme.sizes.iconBadge,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelStack: {
    gap: theme.spacing.xs,
    flex: 1,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  labelTracking: {
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.sizes.size1,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.accentSoft,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  divider: {
    height: theme.sizes.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  bottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  hitSlop: {
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    right: theme.spacing.xs,
  },
}));
