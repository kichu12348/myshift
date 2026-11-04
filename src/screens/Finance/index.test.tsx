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

  it('renders GrossPayHeroCard with remaining balance and payday pill', async () => {
    await renderWithProviders(<FinanceScreen />);

    // Hero card shows Safe to spend section
    expect(screen.getByText('Safe to spend')).toBeTruthy();
    // Payday pill shows formatted payday
    expect(screen.getByText('Payday: Oct 25')).toBeTruthy();
    // Gross metrics row
    expect(screen.getByText('Gross (Manual)')).toBeTruthy();
    expect(screen.getByText('$3,000.00')).toBeTruthy();
    expect(screen.getByText('Take-home Pay')).toBeTruthy();
    expect(screen.getByText('Deductions')).toBeTruthy();
  });

  it('renders EarningsBreakdownCard with total planned deductions and remaining take-home balance', async () => {
    await renderWithProviders(<FinanceScreen />);

    expect(screen.getByText('Deductions')).toBeTruthy();
    expect(screen.getByText('-$2,100.00')).toBeTruthy();
    expect(screen.getByText('Income Tax')).toBeTruthy();
    expect(screen.getAllByText('-$600.00').length).toBeGreaterThanOrEqual(1);

    // Take-Home Pay ($3,000 - $2,100 = $900)
    expect(screen.getByText('Take-home Pay')).toBeTruthy();
    expect(screen.getAllByText('$900.00').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Waterfall grouped ledger with running balance under each row', async () => {
    await renderWithProviders(<FinanceScreen />);

    expect(screen.getByText('Plan for this month')).toBeTruthy();

    // First waterfall expense: Rent ($1000)
    expect(screen.getByText('Rent')).toBeTruthy();
    expect(screen.getByText('-$1,000.00')).toBeTruthy();
    expect(screen.getByText('Fixed · $1,400.00 left')).toBeTruthy();

    // Second waterfall expense: Sending Money Home ($500)
    expect(screen.getByText('Sending Money Home')).toBeTruthy();
    expect(screen.getByText('-$500.00')).toBeTruthy();
    expect(screen.getByText('Fixed · $900.00 left')).toBeTruthy();
  });

  it('toggles Paid/Sent status on an item with haptic feedback', async () => {
    const selectionSpy = jest.spyOn(haptics, 'selection');
    await renderWithProviders(<FinanceScreen />);

    // Rent checkbox
    const markPaidCheckboxes = screen.getAllByRole('checkbox', { name: 'Mark Paid' });
    const targetCheckbox = markPaidCheckboxes[0];
    expect(targetCheckbox).toBeDefined();
    if (targetCheckbox !== undefined) {
      await fireEvent.press(targetCheckbox);
    }

    expect(selectionSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      const state = useFinanceStore.getState();
      const updatedEntry =
        state.monthlyEntries['2026-10']?.find((i) => i.id === 'tax-1' || i.id === 'expense-1');
      expect(updatedEntry?.isPaid).toBe(true);
    });
    selectionSpy.mockRestore();
  });

  it('renders Final Balance Summary Card with remaining balance, daily allowance, and unpaid bills', async () => {
    await renderWithProviders(<FinanceScreen />);

    expect(screen.getByText('Unallocated')).toBeTruthy();
    expect(screen.getByText('Left to assign')).toBeTruthy();
    // Remaining balance is $900.00
    expect(screen.getAllByText('$900.00').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Safe to spend')).toBeTruthy();
    expect(screen.getAllByText(/day/).length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing gross earnings via GrossAndCutoffModal', async () => {
    await renderWithProviders(<FinanceScreen />);

    // Payday pill opens the modal
    const editGrossButton = screen.getByRole('button', { name: 'Edit gross earnings' });
    await fireEvent.press(editGrossButton);

    expect(screen.getByText('Gross Pay & Cutoff')).toBeTruthy();

    const input = screen.getByLabelText('Gross earnings amount');
    await fireEvent.changeText(input, '4500');

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      expect(state.monthlyConfigs['2026-10']?.manualGrossOverride).toBe(4500);
    });
  });

  it('allows changing pay period dates and payday cutoff via GrossAndCutoffModal', async () => {
    await renderWithProviders(<FinanceScreen />);

    const cutoffButton = screen.getByRole('button', {
      name: /Change payday cutoff/,
    });
    await fireEvent.press(cutoffButton);

    expect(screen.getByText('PAY PERIOD DATES')).toBeTruthy();

    const preset20 = screen.getByRole('button', { name: '20th to 20th preset' });
    await fireEvent.press(preset20);

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      expect(state.payCycleProfile.paydayDayOfMonth).toBe(20);
    });
  });

  it('adds a new tax rate (%) via FinanceEntryModal', async () => {
    await renderWithProviders(<FinanceScreen />);

    const addAllocationButton = screen.getByRole('button', { name: 'Add allocation' });
    await fireEvent.press(addAllocationButton);

    const taxTypeButton = screen.getByRole('button', { name: 'Tax type' });
    await fireEvent.press(taxTypeButton);

    const nameInput = screen.getByLabelText('Item name');
    await fireEvent.changeText(nameInput, 'State Tax');

    const amountInput = screen.getByLabelText('Item amount');
    await fireEvent.changeText(amountInput, '5');

    const saveButton = screen.getByRole('button', { name: 'Add Allocation' });
    await fireEvent.press(saveButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      const newEntry = state.monthlyEntries['2026-10']?.find((e) => e.name === 'State Tax');
      expect(newEntry).toBeDefined();
      expect(newEntry?.category).toBe('tax');
      expect(newEntry?.valueMode).toBe('percentage');
      expect(newEntry?.value).toBe(5);
    });
  });

  it('adds a new expense item (Fixed $) via FinanceEntryModal', async () => {
    await renderWithProviders(<FinanceScreen />);

    const addAllocationButton = screen.getByRole('button', { name: 'Add allocation' });
    await fireEvent.press(addAllocationButton);

    const nameInput = screen.getByLabelText('Item name');
    await fireEvent.changeText(nameInput, 'Groceries');

    const amountInput = screen.getByLabelText('Item amount');
    await fireEvent.changeText(amountInput, '350');

    const saveButton = screen.getByRole('button', { name: 'Add Allocation' });
    await fireEvent.press(saveButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      const newEntry = state.monthlyEntries['2026-10']?.find((e) => e.name === 'Groceries');
      expect(newEntry).toBeDefined();
      expect(newEntry?.category).toBe('expense');
      expect(newEntry?.valueMode).toBe('fixed');
      expect(newEntry?.value).toBe(350);
    });

    // EarningsBreakdownCard immediately reflects the added charge
    await waitFor(() => {
      expect(screen.getByText('-$2,450.00')).toBeTruthy();
      expect(screen.getAllByText('$550.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('copies budget structure from another month without copying that month gross earnings', async () => {
    const septEntries: MonthlyFinanceEntry[] = [
      {
        id: 'sept-rent',
        monthKey: '2026-09',
        templateId: null,
        name: 'Sept Rent',
        category: 'expense',
        valueMode: 'fixed',
        value: 1200,
        icon: 'home',
        color: '#5B7DB1',
        sortOrder: 1,
        isPaid: false,
      },
    ];

    useFinanceStore.setState((prev) => ({
      ...prev,
      monthlyConfigs: {
        ...prev.monthlyConfigs,
        '2026-09': {
          monthKey: '2026-09',
          customStartDate: null,
          customEndDate: null,
          manualGrossOverride: 5000,
          notes: '',
        },
      },
      monthlyEntries: {
        ...prev.monthlyEntries,
        '2026-09': septEntries,
      },
    }));

    await renderWithProviders(<FinanceScreen />);

    const copyStructureButton = screen.getByRole('button', { name: 'Copy budget structure' });
    await fireEvent.press(copyStructureButton);

    expect(
      screen.getByText(
        "Copies only your tax rates and expense items. Gross earnings are always calculated fresh from this month's shifts.",
      ),
    ).toBeTruthy();

    const prevMonthButton = screen.getByRole('button', {
      name: 'Copy from previous month September 2026',
    });
    await fireEvent.press(prevMonthButton);

    await waitFor(() => {
      const state = useFinanceStore.getState();
      const currentConfig = state.monthlyConfigs['2026-10'];
      expect(currentConfig?.manualGrossOverride).toBeNull();
      const copied = state.monthlyEntries['2026-10']?.find((e) => e.name === 'Sept Rent');
      expect(copied).toBeDefined();
    });
  });
});
