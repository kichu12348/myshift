import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { FinanceScreen } from './index';
import { renderWithProviders } from '@/testing';
import type { MonthlyFinanceConfig, MonthlyFinanceEntry, PayCycleProfile, Shift } from '@/domain';
import { useFinanceStore, useRotationStore, useShiftStore, useTemplateStore } from '@/store';
import { haptics } from '@/services';

const mockNavigate = jest.fn();
const mockGetShiftsByDateRange = jest.fn<Promise<readonly Shift[]>, [from: string, to: string]>(
  () => Promise.resolve([]),
);
const mockGetPayCycleProfile = jest.fn<Promise<PayCycleProfile>, []>();
const mockGetMonthlyConfig = jest.fn<Promise<MonthlyFinanceConfig | null>, [monthKey: string]>();
const mockGetMonthlyEntries = jest.fn<
  Promise<readonly MonthlyFinanceEntry[]>,
  [monthKey: string]
>();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      getByDateRange: (from: string, to: string): Promise<readonly Shift[]> =>
        mockGetShiftsByDateRange(from, to),
    },
    rotationExceptions: {
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    finance: {
      getPayCycleProfile: () => mockGetPayCycleProfile(),
      savePayCycleProfile: jest.fn().mockResolvedValue(undefined),
      getMonthlyConfig: (m: string) => mockGetMonthlyConfig(m),
      upsertMonthlyConfig: jest.fn().mockResolvedValue(undefined),
      getMonthlyEntries: (m: string) => mockGetMonthlyEntries(m),
      upsertMonthlyEntry: jest.fn().mockResolvedValue(undefined),
      deleteMonthlyEntry: jest.fn().mockResolvedValue(undefined),
      setEntryPaid: jest.fn().mockResolvedValue(undefined),
      getTemplates: jest.fn().mockResolvedValue([]),
      upsertTemplate: jest.fn().mockResolvedValue(undefined),
      deleteTemplate: jest.fn().mockResolvedValue(undefined),
      insertMonthlyEntries: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('FinanceScreen', () => {
  const defaultProfile: PayCycleProfile = {
    isConfigured: true,
    paydayDayOfMonth: 25,
    anchorPaydayDate: '',
    cycleLengthUnit: 'financial-month',
    cycleLengthDays: 28,
  };

  const sampleEntries: MonthlyFinanceEntry[] = [
    {
      id: 'tax-1',
      monthKey: '2026-10',
      templateId: null,
      name: 'Income Tax',
      category: 'tax',
      valueMode: 'fixed',
      value: 600,
      icon: 'percent',
      color: '#EF4444',
      sortOrder: 1,
      isPaid: false,
    },
    {
      id: 'expense-1',
      monthKey: '2026-10',
      templateId: null,
      name: 'Rent',
      category: 'expense',
      valueMode: 'fixed',
      value: 1000,
      icon: 'home',
      color: '#5B7DB1',
      sortOrder: 2,
      isPaid: false,
    },
    {
      id: 'remittance-1',
      monthKey: '2026-10',
      templateId: null,
      name: 'Sending Money Home',
      category: 'remittance',
      valueMode: 'fixed',
      value: 500,
      icon: 'heart',
      color: '#10B981',
      sortOrder: 3,
      isPaid: true,
    },
  ];

  const sampleConfig: MonthlyFinanceConfig = {
    monthKey: '2026-10',
    customStartDate: null,
    customEndDate: null,
    manualGrossOverride: 3000,
    notes: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T12:00:00Z'));

    mockGetShiftsByDateRange.mockResolvedValue([]);
    mockGetPayCycleProfile.mockResolvedValue(defaultProfile);
    mockGetMonthlyConfig.mockResolvedValue(sampleConfig);
    mockGetMonthlyEntries.mockResolvedValue(sampleEntries);
    useShiftStore.setState({ shifts: [], status: 'ready' });
    useRotationStore.setState({ exceptions: [], rotations: [] });
    useTemplateStore.setState({ templates: [] });

    useFinanceStore.setState({
      payCycleProfile: defaultProfile,
      monthlyConfigs: { '2026-10': sampleConfig },
      monthlyEntries: { '2026-10': sampleEntries },
      templates: [],
      status: 'ready',
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders Gross Earnings hero card with manual override amount and payday cutoff', async () => {
    await renderWithProviders(<FinanceScreen />);

    // Check Gross Earnings header and manual override badge
    expect(screen.getByText('GROSS EARNINGS')).toBeTruthy();
    expect(screen.getByText('Manual Override')).toBeTruthy();
    expect(screen.getByText('$3,000.00')).toBeTruthy();

    // Check Payday Cutoff pill
    expect(screen.getByText('Cutoff: 25th')).toBeTruthy();
  });

  it('renders Tax Deductions card with net take-home pay footer banner', async () => {
    await renderWithProviders(<FinanceScreen />);

    // Taxes & Deductions section
    expect(screen.getByText('TAXES & DEDUCTIONS')).toBeTruthy();
    expect(screen.getByText('Income Tax')).toBeTruthy();
    expect(screen.getByText('-$600.00')).toBeTruthy();

    // Attached Net Take-Home Pay Banner ($3,000 - $600 = $2,400)
    expect(screen.getByText('Net Take-Home Pay')).toBeTruthy();
    expect(screen.getByText('$2,400.00')).toBeTruthy();
  });

  it('renders Waterfall ledger items and running balance readout under each card', async () => {
    await renderWithProviders(<FinanceScreen />);

    expect(screen.getByText('MONTHLY ALLOCATIONS & BILLS')).toBeTruthy();

    // First waterfall expense: Rent ($1000)
    expect(screen.getByText('Rent')).toBeTruthy();
    expect(screen.getByText('-$1,000.00')).toBeTruthy();
    expect(screen.getByText('Balance after Rent')).toBeTruthy();
    // Net take-home $2400 - $1000 = $1400
    expect(screen.getByText('$1,400.00')).toBeTruthy();

    // Second waterfall expense: Sending Money Home ($500)
    expect(screen.getByText('Sending Money Home')).toBeTruthy();
    expect(screen.getByText('-$500.00')).toBeTruthy();
    expect(screen.getByText('Balance after Sending Money Home')).toBeTruthy();
    // $1400 - $500 = $900
    expect(screen.getAllByText('$900.00').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles Paid/Sent status on an item with haptic feedback', async () => {
    const successSpy = jest.spyOn(haptics, 'success');
    await renderWithProviders(<FinanceScreen />);

    const markPaidCheckbox = screen.getByRole('checkbox', { name: 'Mark Paid' });
    await fireEvent.press(markPaidCheckbox);

    expect(successSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      const state = useFinanceStore.getState();
      const rent = state.monthlyEntries['2026-10']?.find((i) => i.id === 'expense-1');
      expect(rent?.isPaid).toBe(true);
    });
    successSpy.mockRestore();
  });

  it('renders Final Balance Summary Card with remaining balance, daily allowance, and unpaid bills', async () => {
    await renderWithProviders(<FinanceScreen />);

    expect(screen.getByText('REMAINING UNALLOCATED BALANCE')).toBeTruthy();
    // Remaining balance is $900.00
    expect(screen.getAllByText('$900.00').length).toBeGreaterThanOrEqual(1);

    // Daily safe-to-spend allowance
    expect(screen.getByText('Safe-to-Spend Daily')).toBeTruthy();
    expect(screen.getByText(/day/)).toBeTruthy();

    // Unpaid bills remaining (Rent is unpaid = $1000)
    expect(screen.getByText('Unpaid Bills')).toBeTruthy();
    expect(screen.getByText('$1,000.00 left to pay')).toBeTruthy();
  });

  it('allows editing gross earnings via modal and saving override', async () => {
    await renderWithProviders(<FinanceScreen />);

    const editGrossButton = screen.getByRole('button', { name: 'Edit gross earnings' });
    await fireEvent.press(editGrossButton);

    expect(screen.getByText('Edit Gross Earnings')).toBeTruthy();

    const input = screen.getByLabelText('Gross earnings amount');
    await fireEvent.changeText(input, '4500');

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      expect(state.monthlyConfigs['2026-10']?.manualGrossOverride).toBe(4500);
    });
  });

  it('allows changing payday cutoff day via cutoff modal', async () => {
    await renderWithProviders(<FinanceScreen />);

    const cutoffButton = screen.getByRole('button', {
      name: 'Change payday cutoff, current Cutoff: 25th',
    });
    await fireEvent.press(cutoffButton);

    expect(screen.getByText('Payday Cutoff Day')).toBeTruthy();

    const day15Button = screen.getByRole('button', { name: 'Day 15th' });
    await fireEvent.press(day15Button);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      expect(state.payCycleProfile.paydayDayOfMonth).toBe(15);
    });
  });
});
