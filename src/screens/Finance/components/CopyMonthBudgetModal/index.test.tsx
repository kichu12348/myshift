import { fireEvent, screen } from '@testing-library/react-native';
import { CopyMonthBudgetModal } from './index';
import { renderWithProviders } from '@/testing';

describe('CopyMonthBudgetModal', () => {
  const mockOnCopyFromMonth = jest.fn();
  const mockOnResetToTemplates = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders explaining helper note about copying tax and expenses only', async () => {
    await renderWithProviders(
      <CopyMonthBudgetModal
        visible={true}
        currentMonthKey="2026-11"
        previousMonthKey="2026-10"
        pastConfiguredMonths={['2026-10', '2026-09']}
        onCopyFromMonth={mockOnCopyFromMonth}
        onResetToTemplates={mockOnResetToTemplates}
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(
        "Copies only your tax rates and expense items. Gross earnings are always calculated fresh from this month's shifts.",
      ),
    ).toBeTruthy();
  });

  it('copies structure from previous month', async () => {
    await renderWithProviders(
      <CopyMonthBudgetModal
        visible={true}
        currentMonthKey="2026-11"
        previousMonthKey="2026-10"
        pastConfiguredMonths={['2026-10']}
        onCopyFromMonth={mockOnCopyFromMonth}
        onResetToTemplates={mockOnResetToTemplates}
        onClose={mockOnClose}
      />,
    );

    const prevMonthButton = screen.getByRole('button', {
      name: 'Copy from previous month October 2026',
    });
    await fireEvent.press(prevMonthButton);

    expect(mockOnCopyFromMonth).toHaveBeenCalledWith('2026-10');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('copies structure from any past configured month', async () => {
    await renderWithProviders(
      <CopyMonthBudgetModal
        visible={true}
        currentMonthKey="2026-11"
        previousMonthKey="2026-10"
        pastConfiguredMonths={['2026-10', '2026-09', '2026-08']}
        onCopyFromMonth={mockOnCopyFromMonth}
        onResetToTemplates={mockOnResetToTemplates}
        onClose={mockOnClose}
      />,
    );

    const septButton = screen.getByRole('button', {
      name: 'Copy structure from September 2026',
    });
    await fireEvent.press(septButton);

    expect(mockOnCopyFromMonth).toHaveBeenCalledWith('2026-09');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('resets structure to default templates', async () => {
    await renderWithProviders(
      <CopyMonthBudgetModal
        visible={true}
        currentMonthKey="2026-11"
        previousMonthKey="2026-10"
        pastConfiguredMonths={[]}
        onCopyFromMonth={mockOnCopyFromMonth}
        onResetToTemplates={mockOnResetToTemplates}
        onClose={mockOnClose}
      />,
    );

    const resetButton = screen.getByRole('button', {
      name: 'Reset to default templates',
    });
    await fireEvent.press(resetButton);

    expect(mockOnResetToTemplates).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

