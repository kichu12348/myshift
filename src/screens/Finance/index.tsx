import { useCallback, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MonthHeader } from '@/components';
import { MONTH_NAMES } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { getYearMonth } from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { makeStyles } from '@/theme';
import { FinalBalanceSummaryCard } from './components/FinalBalanceSummaryCard';
import { GrossPayHeroCard } from './components/GrossPayHeroCard';
import { TaxDeductionsCard } from './components/TaxDeductionsCard';
import { WaterfallExpenseList } from './components/WaterfallExpenseList';
import { useFinanceMonth } from './hooks/useFinanceMonth';

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
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setManualGross,
    setPaydayCutoff,
    togglePaid,
  } = useFinanceMonth();

  const currentMonth = getYearMonth(today);
  const isCurrentMonth =
    visibleMonth.year === currentMonth.year && visibleMonth.month === currentMonth.month;

  const monthName = MONTH_NAMES[visibleMonth.month - 1] ?? '';
  const monthTitle = `${monthName} ${visibleMonth.year}`;

  const { waterfall, shiftEarnings, profile, dailyAllowance, unpaidBillsAmount } = data;

  const handleNavigateTemplates = useCallback(() => {
    navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
  }, [navigation]);

  const handleSaveGross = useCallback(
    (amount: number): void => {
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
          onSaveGrossOverride={handleSaveGross}
          onSyncFromShifts={handleSyncFromShifts}
          onSavePaydayCutoff={handleSavePaydayCutoff}
          onNavigateTemplates={handleNavigateTemplates}
        />

        <TaxDeductionsCard
          taxItems={waterfall.taxItems}
          netTakeHomePay={waterfall.netTakeHomePay}
        />

        <WaterfallExpenseList
          items={waterfall.waterfallItems}
          onTogglePaid={handleTogglePaid}
          onManageTemplates={handleNavigateTemplates}
        />

        <FinalBalanceSummaryCard
          finalRemainingBalance={waterfall.finalRemainingBalance}
          isOverdrawn={waterfall.isOverdrawn}
          dailyAllowance={dailyAllowance}
          unpaidBillsAmount={unpaidBillsAmount}
        />
      </ScrollView>
    </View>
  );
}

export default FinanceScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}));
