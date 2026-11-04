import { fireEvent, screen } from '@testing-library/react-native';
import { FinanceEntryModal } from './index';
import { renderWithProviders } from '@/testing';
import type { MonthlyFinanceEntry } from '@/domain';
import { useFinanceStore } from '@/store';

describe('FinanceEntryModal', () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useFinanceStore.setState({
      templates: [
        {
          id: 'tpl-rent',
          name: 'Rent',
          category: 'expense',
          valueMode: 'fixed',
          value: 1200,
          icon: 'home',
          color: '#0EA5E9',
          sortOrder: 1,
          isActive: true,
        },
      ],
    });
  });

  it('renders live preview banner with computed amount and balance impact', async () => {
    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        currentEffectiveGross={3000}
        currentRemainingBalance={2500}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('New Item')).toBeTruthy();
    expect(screen.getByText(/Balance after: \$2,500\.00/)).toBeTruthy();
  });

  it('renders "New Allocation" title for new items', async () => {
    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        currentEffectiveGross={3000}
        currentRemainingBalance={2500}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('New Allocation')).toBeTruthy();
  });

  it('renders "Edit Allocation" title for existing items', async () => {
    const existingEntry: MonthlyFinanceEntry = {
      id: 'entry-123',
      monthKey: '2026-11',
      templateId: null,
      name: 'Internet Bill',
      category: 'expense',
      valueMode: 'fixed',
      value: 70,
      icon: 'wifi',
      color: '#5B7DB1',
      sortOrder: 2,
      isPaid: false,
    };

    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        initialEntry={existingEntry}
        currentEffectiveGross={3000}
        currentRemainingBalance={1500}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('Edit Allocation')).toBeTruthy();
  });

  it('adds a tax rate percentage item', async () => {
    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        initialCategory="tax"
        currentEffectiveGross={4000}
        currentRemainingBalance={4000}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const nameInput = screen.getByLabelText('Item name');
    await fireEvent.changeText(nameInput, 'Federal Tax');

    const amountInput = screen.getByLabelText('Item amount');
    await fireEvent.changeText(amountInput, '20');

    // 20% of 4000 is 800
    expect(screen.getByText(/20% \(\$800\.00\) · Balance after: \$3,200\.00/)).toBeTruthy();

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      id: undefined,
      name: 'Federal Tax',
      category: 'tax',
      valueMode: 'percentage',
      value: 20,
      icon: 'percent',
      color: '#EF4444',
      saveAsTemplate: false,
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('edits an existing fixed expense item and updates icon, color, and saveAsTemplate', async () => {
    const existingEntry: MonthlyFinanceEntry = {
      id: 'entry-123',
      monthKey: '2026-11',
      templateId: null,
      name: 'Internet Bill',
      category: 'expense',
      valueMode: 'fixed',
      value: 70,
      icon: 'wifi',
      color: '#5B7DB1',
      sortOrder: 2,
      isPaid: false,
    };

    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        initialEntry={existingEntry}
        currentEffectiveGross={3000}
        currentRemainingBalance={1500}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('Internet Bill')).toBeTruthy();

    const amountInput = screen.getByLabelText('Item amount');
    await fireEvent.changeText(amountInput, '85');

    // Expand appearance panel first
    const appearanceButton = screen.getByRole('button', { name: 'Toggle color and icon picker' });
    await fireEvent.press(appearanceButton);

    const zapIcon = screen.getByRole('button', { name: 'Icon zap' });
    await fireEvent.press(zapIcon);

    const amberColor = screen.getByRole('button', { name: 'Color Amber' });
    await fireEvent.press(amberColor);

    const templateSwitch = screen.getByLabelText('Save as reusable template');
    await fireEvent.press(templateSwitch);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'entry-123',
      name: 'Internet Bill',
      category: 'expense',
      valueMode: 'fixed',
      value: 85,
      icon: 'zap',
      color: '#F59E0B',
      saveAsTemplate: true,
    });
  });

  it('fills item fields when tapping a quick-fill saved template (new item only)', async () => {
    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        currentEffectiveGross={3000}
        currentRemainingBalance={2000}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const quickFillRent = screen.getByRole('button', { name: 'Quick fill Rent' });
    await fireEvent.press(quickFillRent);

    const nameInput = screen.getByLabelText('Item name');
    expect(nameInput.props.value).toBe('Rent');

    const amountInput = screen.getByLabelText('Item amount');
    expect(amountInput.props.value).toBe('1200');
  });

  it('performs two-step delete flow for existing items', async () => {
    const existingEntry: MonthlyFinanceEntry = {
      id: 'entry-to-del',
      monthKey: '2026-11',
      templateId: null,
      name: 'Old Expense',
      category: 'expense',
      valueMode: 'fixed',
      value: 50,
      icon: 'home',
      color: '#5B7DB1',
      sortOrder: 1,
      isPaid: false,
    };

    await renderWithProviders(
      <FinanceEntryModal
        visible={true}
        initialEntry={existingEntry}
        currentEffectiveGross={3000}
        currentRemainingBalance={1000}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await fireEvent.press(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();

    const confirmDeleteButton = screen.getByRole('button', { name: 'Confirm Delete' });
    await fireEvent.press(confirmDeleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('entry-to-del');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
