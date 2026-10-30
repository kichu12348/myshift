import { useCallback, useMemo, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MonthHeader } from '@/components';
import { MONTH_NAMES } from '@/constants';
import { ROOT_ROUTES } from '@/constants/routes';
import { formatDurationHoursMinutes, getYearMonth } from '@/domain';
import { useToday } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { makeStyles } from '@/theme';
import { ShiftBreakdownList } from './components/ShiftBreakdownList';
import { StatsOverviewCard } from './components/StatsOverviewCard';
import { useMonthlyStats } from './hooks/useMonthlyStats';

/**
 * Screen displaying monthly working hours, shift breakdown, and estimated earnings.
 */
export function StatsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = useToday();

  const { visibleMonth, summary, goToPreviousMonth, goToNextMonth, goToCurrentMonth } =
    useMonthlyStats();

  const currentMonth = getYearMonth(today);
  const isCurrentMonth =
    visibleMonth.year === currentMonth.year && visibleMonth.month === currentMonth.month;

  const monthName = MONTH_NAMES[visibleMonth.month - 1] ?? '';
  const monthTitle = `${monthName} ${visibleMonth.year}`;

  const workloadSubtitle = useMemo(() => {
    const formattedHours = formatDurationHoursMinutes(summary.totalNetMinutes);
    const shiftLabel = `${summary.workingShiftCount} ${summary.workingShiftCount === 1 ? 'shift' : 'shifts'}`;
    return `${shiftLabel} \u00b7 ${formattedHours}`;
  }, [summary.workingShiftCount, summary.totalNetMinutes]);

  const handleNavigateTemplates = useCallback(() => {
    navigation.navigate(ROOT_ROUTES.TEMPLATE_LIST);
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MonthHeader
        title={monthTitle}
        subtitle={workloadSubtitle}
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
        <StatsOverviewCard summary={summary} onNavigateTemplates={handleNavigateTemplates} />
        <ShiftBreakdownList
          breakdown={summary.breakdown}
          monthName={monthName}
          year={visibleMonth.year}
        />
      </ScrollView>
    </View>
  );
}

export default StatsScreen;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}));
