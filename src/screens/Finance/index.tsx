import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { MONTH_NAMES } from '@/constants';
import { addMonths, type FinanceRuleType, type MonthlyFinanceEntry } from '@/domain';
import { makeStyles } from '@/theme';
import { CopyMonthBudgetModal } from './components/CopyMonthBudgetModal';
import { EarningsBreakdownCard } from './components/EarningsBreakdownCard';
import { FinanceEntryModal } from './components/FinanceEntryModal';
import { GrossAndCutoffModal } from './components/GrossAndCutoffModal';
import { GrossPayHeroCard } from './components/GrossPayHeroCard';
import { WaterfallExpenseList } from './components/WaterfallExpenseList';
import { useFinanceMonth } from './hooks/useFinanceMonth';

interface ActiveModalState {
  readonly entry?: MonthlyFinanceEntry | null;
  readonly category?: FinanceRuleType;
}

/**
 * Screen displaying monthly finance hero metrics, earnings breakdown, and waterfall expense ledger.
 */
export function FinanceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  const {
    visibleMonth,
    data,
    primaryHourlyRate,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setManualGross,
    setPaydayCutoff,
    togglePaid,
    saveEntry,
    deleteEntry,
    copyStructure,
    resetToDefaultTemplates,
    getConfiguredMonths,
    updateBaseHourlyRate,
  } = useFinanceMonth();

  const [activeEntryModal, setActiveEntryModal] = useState<ActiveModalState | null>(null);
  const [isGrossModalOpen, setIsGrossModalOpen] = useState<boolean>(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [pastMonths, setPastMonths] = useState<readonly string[]>([]);

  useEffect(() => {
    void getConfiguredMonths().then(setPastMonths);
  }, [getConfiguredMonths, data.monthKey]);

  const monthName = MONTH_NAMES[visibleMonth.month - 1] ?? '';
  const monthTitle = `${monthName} ${visibleMonth.year}`;

  const prevYm = addMonths(visibleMonth, -1);
  const previousMonthKey = `${prevYm.year}-${String(prevYm.month).padStart(2, '0')}`;

  const { waterfall, shiftEarnings, profile, dailyAllowance } = data;

  const totalTaxes = waterfall.taxItems.reduce((sum, t) => sum + t.computedAmount, 0);

  // Combine tax and non-tax waterfall items for the unified "Plan for this month" list
  const allMonthlyAllocations = useMemo(() => {
    return [...waterfall.taxItems, ...waterfall.waterfallItems];
  }, [waterfall.taxItems, waterfall.waterfallItems]);

  const handleSaveGross = useCallback(
    (amount: number | null): void => {
      void setManualGross(amount);
    },
    [setManualGross],
  );

  const handleSavePaydayCutoff = useCallback(
    (day: number): void => {
      void setPaydayCutoff(day);
    },
    [setPaydayCutoff],
  );

  const handleTogglePaid = useCallback(
    (entryId: string): void => {
      void togglePaid(entryId);
    },
    [togglePaid],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text variant="display" weight="semibold">
            Finance
          </Text>
          <View style={styles.monthSubtitleRow}>
            <Text variant="body" tone="muted">
              {monthTitle}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Today"
            onPress={goToCurrentMonth}
            style={({ pressed }) => [styles.headerCircleButton, pressed && styles.pressed]}
            hitSlop={styles.hitSlop}
          >
            <Icon name="calendar" size={18} tone="muted" />
          </Pressable>

          <View style={styles.stepperPill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={goToPreviousMonth}
              style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="chevron-left" size={16} tone="muted" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={goToNextMonth}
              style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
              hitSlop={styles.hitSlop}
            >
              <Icon name="chevron-right" size={16} tone="muted" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Card 1 — SafeToSpendHeroCard */}
        <GrossPayHeroCard
          dailyAllowance={dailyAllowance}
          paydayDayOfMonth={profile.paydayDayOfMonth}
          effectiveGrossPay={shiftEarnings.effectiveGrossPay}
          autoGrossPay={shiftEarnings.autoGrossPay}
          isManualGrossOverride={shiftEarnings.isManualGrossOverride}
          workingShiftCount={shiftEarnings.workingShiftCount}
          totalNetMinutes={shiftEarnings.totalNetMinutes}
          baseHourlyRate={primaryHourlyRate}
          effectiveStartDate={
            data.windowResult.effectiveStartDate ?? data.windowResult.guessedStartDate
          }
          effectiveEndDate={data.windowResult.effectiveEndDate ?? data.windowResult.guessedEndDate}
          onOpenCutoffModal={() => setIsGrossModalOpen(true)}
        />

        {/* 3. Card 2 — EarningsBreakdownCard (3-Row Summary Card) */}
        <EarningsBreakdownCard
          isManualGross={shiftEarnings.isManualGrossOverride}
          grossPay={shiftEarnings.effectiveGrossPay}
          totalDeductions={totalTaxes}
          takeHomePay={waterfall.netTakeHomePay}
          onPressGross={() => setIsGrossModalOpen(true)}
        />

        {/* 4. Section — Plan for this month (WaterfallExpenseList) */}
        <WaterfallExpenseList
          items={allMonthlyAllocations}
          unallocated={waterfall.finalRemainingBalance}
          onTogglePaid={handleTogglePaid}
          onAddItem={() => setActiveEntryModal({ category: 'expense' })}
          onCopyStructure={() => setIsCopyModalOpen(true)}
          onPressItem={(item) => setActiveEntryModal({ entry: item, category: item.category })}
        />
      </ScrollView>

      {/* Gross Pay & Cutoff Modal */}
      <GrossAndCutoffModal
        visible={isGrossModalOpen}
        autoGrossPay={shiftEarnings.autoGrossPay}
        isManualGrossOverride={shiftEarnings.isManualGrossOverride}
        currentGrossPay={shiftEarnings.effectiveGrossPay}
        paydayDayOfMonth={profile.paydayDayOfMonth}
        workingShiftCount={shiftEarnings.workingShiftCount}
        totalNetMinutes={shiftEarnings.totalNetMinutes}
        baseHourlyRate={primaryHourlyRate}
        onSaveGrossOverride={handleSaveGross}
        onSavePaydayCutoff={handleSavePaydayCutoff}
        onUpdateBaseHourlyRate={(r) => void updateBaseHourlyRate(r)}
        onClose={() => setIsGrossModalOpen(false)}
      />

      {/* New / Edit Allocation Sheet */}
      {activeEntryModal !== null ? (
        <FinanceEntryModal
          visible={true}
          initialEntry={activeEntryModal.entry}
          initialCategory={activeEntryModal.category}
          currentEffectiveGross={shiftEarnings.effectiveGrossPay}
          currentRemainingBalance={waterfall.finalRemainingBalance}
          onSave={(p) => void saveEntry(p)}
          onDelete={(id) => void deleteEntry(id)}
          onClose={() => setActiveEntryModal(null)}
        />
      ) : null}

      {/* Copy Month Modal */}
      <CopyMonthBudgetModal
        visible={isCopyModalOpen}
        currentMonthKey={data.monthKey}
        previousMonthKey={previousMonthKey}
        pastConfiguredMonths={pastMonths}
        onCopyFromMonth={(src) => void copyStructure(src)}
        onResetToTemplates={() => void resetToDefaultTemplates()}
        onClose={() => setIsCopyModalOpen(false)}
      />
    </View>
  );
}

export default FinanceScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerLeft: {
    gap: theme.spacing.xs,
  },
  monthSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerCircleButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPill: {
    height: theme.sizes.touchTarget,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  stepperButton: {
    width: theme.sizes.touchTarget - theme.spacing.sm,
    height: theme.sizes.touchTarget - theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
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
