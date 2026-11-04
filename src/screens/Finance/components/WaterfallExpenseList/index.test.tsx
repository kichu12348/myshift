import { fireEvent, screen } from '@testing-library/react-native';
import { WaterfallExpenseList } from './index';
import { renderWithProviders } from '@/testing';
import type { WaterfallItem } from '@/domain';

describe('WaterfallExpenseList', () => {
  const mockOnTogglePaid = jest.fn();
  const mockOnAddItem = jest.fn();
  const mockOnPressItem = jest.fn();

  const sampleItems: WaterfallItem[] = [
    {
      entry: {
        id: 'tax-1',
        monthKey: '2026-11',
        templateId: null,
        name: 'Income Tax',
        category: 'tax',
        valueMode: 'percentage',
        value: 30,
        icon: 'percent',
        color: '#EF4444',
        sortOrder: 1,
        isPaid: false,
      },
      computedAmount: 110.6,
      effectivePercentage: 30,
      balanceBefore: 368.67,
      balanceAfter: 258.07,
      isOverdrawn: false,
      shiftsEquivalent: 1,
    },
    {
      entry: {
        id: 'exp-1',
        monthKey: '2026-11',
        templateId: null,
        name: 'Rent',
        category: 'expense',
        valueMode: 'fixed',
        value: 80,
        icon: 'home',
        color: '#5B7DB1',
        sortOrder: 2,
        isPaid: true,
      },
      computedAmount: 80,
      effectivePercentage: 21.7,
      balanceBefore: 258.07,
      balanceAfter: 178.07,
      isOverdrawn: false,
      shiftsEquivalent: 0.8,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section header, allocations, and standalone unallocated card', async () => {
    await renderWithProviders(
      <WaterfallExpenseList
        items={sampleItems}
        unallocated={47.47}
        onTogglePaid={mockOnTogglePaid}
        onAddItem={mockOnAddItem}
        onPressItem={mockOnPressItem}
      />,
    );

    expect(screen.getByText('Plan for this month')).toBeTruthy();
    expect(screen.getByText('Deductions and allocations from your pay.')).toBeTruthy();
    expect(screen.getByText('Income Tax')).toBeTruthy();
    expect(screen.getByText('30% of gross')).toBeTruthy();
    expect(screen.getByText('-$110.60')).toBeTruthy();
    expect(screen.getByText('Rent')).toBeTruthy();
    expect(screen.getByText('Fixed · $178.07 left')).toBeTruthy();
    expect(screen.getByText('-$80.00')).toBeTruthy();

    expect(screen.getByText('Unallocated')).toBeTruthy();
    expect(screen.getByText('Left to assign')).toBeTruthy();
    expect(screen.getByText('$47.47')).toBeTruthy();
  });

  it('calls onAddItem when Add button is pressed', async () => {
    await renderWithProviders(
      <WaterfallExpenseList
        items={sampleItems}
        unallocated={47.47}
        onAddItem={mockOnAddItem}
      />,
    );

    const addButton = screen.getByRole('button', { name: 'Add allocation' });
    await fireEvent.press(addButton);

    expect(mockOnAddItem).toHaveBeenCalledTimes(1);
  });

  it('calls onPressItem when an item row is tapped', async () => {
    await renderWithProviders(
      <WaterfallExpenseList
        items={sampleItems}
        unallocated={47.47}
        onPressItem={mockOnPressItem}
      />,
    );

    const rentItem = screen.getByRole('button', { name: 'Rent, minus $80.00' });
    await fireEvent.press(rentItem);

    const targetItem = sampleItems[1];
    expect(targetItem).toBeDefined();
    if (targetItem !== undefined) {
      expect(mockOnPressItem).toHaveBeenCalledWith(targetItem.entry);
    }
  });

  it('renders empty message when no items are present', async () => {
    await renderWithProviders(
      <WaterfallExpenseList
        items={[]}
        unallocated={0}
      />,
    );

    expect(screen.getByText('No deductions or allocations added for this month.')).toBeTruthy();
  });
});
