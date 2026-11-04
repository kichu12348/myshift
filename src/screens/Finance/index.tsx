import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon, MonthHeader, Text } from '@/components';
import { MONTH_NAMES } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { addMonths, getYearMonth, type FinanceRuleType, type MonthlyFinanceEntry } from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { makeStyles } from '@/theme';
import { CopyMonthBudgetModal } from './components/CopyMonthBudgetModal';
import { FinalBalanceSummaryCard } from './components/FinalBalanceSummaryCard';
import { FinanceEntryModal } from './components/FinanceEntryModal';
import { GrossPayHeroCard } from './components/GrossPayHeroCard';
import { TaxDeductionsCard } from './components/TaxDeductionsCard';
import { WaterfallExpenseList } from './components/WaterfallExpenseList';
import { useFinanceMonth } from './hooks/useFinanceMonth';

interface ActiveModalState {
  readonly entry?: MonthlyFinanceEntry | null;
  readonly category?: FinanceRuleType;
}

/**
 * Screen displaying monthly finance hero metrics, tax deductions, and waterfall expense ledger.
 */
export function FinanceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = useToday();

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
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [pastMonths, setPastMonths] = useState<readonly string[]>([]);

  useEffect(() => {
    void getConfiguredMonths().then(setPastMonths);
  }, [getConfiguredMonths, data.monthKey]);

  const currentMonth = getYearMonth(today);
  const isCurrentMonth =
    visibleMonth.year === currentMonth.year && visibleMonth.month === currentMonth.month;

  const monthName = MONTH_NAMES[visibleMonth.month - 1] ?? '';
  const monthTitle = `${monthName} ${visibleMonth.year}`;

  const prevYm = addMonths(visibleMonth, -1);
  const previousMonthKey = `${prevYm.year}-${String(prevYm.month).padStart(2, '0')}`;

  const { waterfall, shiftEarnings, profile, dailyAllowance, unpaidBillsAmount } = data;

  const handleNavigateTemplates = useCallback(() => {
    navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
  }, [navigation]);

  const handleSaveGross = useCallback(
    (amount: number | null): void => {
      void setManualGross(amount);
    },
    [setManualGross],
  );

  const handleSyncFromShifts = useCallback((): void => {
    void setManualGross(null);
  }, [setManualGross]);

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
      <MonthHeader
        title={monthTitle}
        showTodayButton={!isCurrentMonth}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToCurrentMonth}
      />
      <View style={styles.headerBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy budget structure"
          onPress={() => setIsCopyModalOpen(true)}
          style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
          hitSlop={styles.hitSlop}
        >
          <Icon name="copy" size={16} tone="secondary" />
          <Text variant="caption" weight="semibold" tone="secondary">
            Copy Structure
          </Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GrossPayHeroCard
          effectiveGrossPay={shiftEarnings.effectiveGrossPay}
          autoGrossPay={shiftEarnings.autoGrossPay}
          isManualGrossOverride={shiftEarnings.isManualGrossOverride}
          paydayDayOfMonth={profile.paydayDayOfMonth}
          workingShiftCount={shiftEarnings.workingShiftCount}
          totalNetMinutes={shiftEarnings.totalNetMinutes}
          baseHourlyRate={primaryHourlyRate}
          onSaveGrossOverride={handleSaveGross}
          onSyncFromShifts={handleSyncFromShifts}
          onSavePaydayCutoff={handleSavePaydayCutoff}
          onUpdateBaseHourlyRate={(r) => void updateBaseHourlyRate(r)}
          onNavigateTemplates={handleNavigateTemplates}
        />

        <TaxDeductionsCard
          taxItems={waterfall.taxItems}
          netTakeHomePay={waterfall.netTakeHomePay}
          onAddTax={() => setActiveEntryModal({ category: 'tax' })}
          onPressTaxItem={(item) => setActiveEntryModal({ entry: item, category: 'tax' })}
        />

        <WaterfallExpenseList
          items={waterfall.waterfallItems}
          onTogglePaid={handleTogglePaid}
          onAddItem={() => setActiveEntryModal({ category: 'expense' })}
          onCopyStructure={() => setIsCopyModalOpen(true)}
          onManageTemplates={handleNavigateTemplates}
          onPressItem={(item) => setActiveEntryModal({ entry: item, category: item.category })}
        />

        <FinalBalanceSummaryCard
          finalRemainingBalance={waterfall.finalRemainingBalance}
          isOverdrawn={waterfall.isOverdrawn}
          dailyAllowance={dailyAllowance}
          unpaidBillsAmount={unpaidBillsAmount}
        />
      </ScrollView>

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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: theme.sizes.hairline,
    borderColor: theme.colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
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
