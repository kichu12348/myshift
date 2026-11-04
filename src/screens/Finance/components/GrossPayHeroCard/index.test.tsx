import { fireEvent, screen } from '@testing-library/react-native';
import { GrossPayHeroCard } from './index';
import { renderWithProviders } from '@/testing';

describe('SafeToSpendHeroCard (GrossPayHeroCard)', () => {
  const mockOnOpenCutoffModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders safe to spend amount, days to payday, and payday caption', async () => {
    await renderWithProviders(
      <GrossPayHeroCard
        dailyAllowance={86.02}
        paydayDayOfMonth={6}
        effectiveStartDate="2026-10-07"
        effectiveEndDate="2026-11-06"
        onOpenCutoffModal={mockOnOpenCutoffModal}
      />,
    );

    expect(screen.getByText('Safe to spend')).toBeTruthy();
    expect(screen.getByText('$86.02')).toBeTruthy();
    expect(screen.getByText(' / day')).toBeTruthy();
    expect(screen.getByText(/to payday/)).toBeTruthy();
    expect(screen.getByText('Payday: Nov 6')).toBeTruthy();
  });

  it('triggers onOpenCutoffModal when tapping the right column', async () => {
    await renderWithProviders(
      <GrossPayHeroCard
        dailyAllowance={86.02}
        paydayDayOfMonth={6}
        effectiveStartDate="2026-10-07"
        effectiveEndDate="2026-11-06"
        onOpenCutoffModal={mockOnOpenCutoffModal}
      />,
    );

    const paydayButton = screen.getByRole('button', { name: /Change payday cutoff/ });
    await fireEvent.press(paydayButton);

    expect(mockOnOpenCutoffModal).toHaveBeenCalledTimes(1);
  });
});

