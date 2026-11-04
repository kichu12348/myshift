import { fireEvent, screen } from '@testing-library/react-native';
import { EarningsBreakdownCard } from './index';
import { renderWithProviders } from '@/testing';

describe('EarningsBreakdownCard', () => {
  const mockOnPressGross = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders gross earnings, deductions, and take-home pay correctly', async () => {
    await renderWithProviders(
      <EarningsBreakdownCard
        isManualGross={false}
        grossPay={368.67}
        totalDeductions={110.6}
        takeHomePay={258.07}
        onPressGross={mockOnPressGross}
      />,
    );

    expect(screen.getByText('Gross (Shifts)')).toBeTruthy();
    expect(screen.getByText('$368.67')).toBeTruthy();
    expect(screen.getByText('Deductions')).toBeTruthy();
    expect(screen.getByText('-$110.60')).toBeTruthy();
    expect(screen.getByText('Take-home Pay')).toBeTruthy();
    expect(screen.getByText('$258.07')).toBeTruthy();
  });

  it('renders Gross (Manual) label when isManualGross is true', async () => {
    await renderWithProviders(
      <EarningsBreakdownCard
        isManualGross={true}
        grossPay={5000}
        totalDeductions={1000}
        takeHomePay={4000}
        onPressGross={mockOnPressGross}
      />,
    );

    expect(screen.getByText('Gross (Manual)')).toBeTruthy();
    expect(screen.getByText('$5,000.00')).toBeTruthy();
  });

  it('triggers onPressGross when tapping the gross row', async () => {
    await renderWithProviders(
      <EarningsBreakdownCard
        isManualGross={false}
        grossPay={3000}
        totalDeductions={600}
        takeHomePay={2400}
        onPressGross={mockOnPressGross}
      />,
    );

    const grossButton = screen.getByRole('button', { name: 'Edit gross earnings' });
    await fireEvent.press(grossButton);

    expect(mockOnPressGross).toHaveBeenCalledTimes(1);
  });
});

