import { fireEvent, screen } from '@testing-library/react-native';
import { GrossAndCutoffModal } from './index';
import { renderWithProviders } from '@/testing';

describe('GrossAndCutoffModal', () => {
  const mockOnSaveGrossOverride = jest.fn();
  const mockOnSavePaydayCutoff = jest.fn();
  const mockOnSavePayPeriodDates = jest.fn();
  const mockOnUpdateBaseHourlyRate = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Auto Mode breakdown and updates base hourly rate', async () => {
    await renderWithProviders(
      <GrossAndCutoffModal
        visible={true}
        autoGrossPay={4200}
        isManualGrossOverride={false}
        currentGrossPay={4200}
        paydayDayOfMonth={25}
        workingShiftCount={14}
        totalNetMinutes={10080}
        baseHourlyRate={25}
        onSaveGrossOverride={mockOnSaveGrossOverride}
        onSavePaydayCutoff={mockOnSavePaydayCutoff}
        onUpdateBaseHourlyRate={mockOnUpdateBaseHourlyRate}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText(/14 shifts · 168h × \$25\/hr = \$4,200\.00/)).toBeTruthy();

    const rateInput = screen.getByLabelText('Base hourly rate');
    await fireEvent.changeText(rateInput, '30');

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    expect(mockOnSaveGrossOverride).toHaveBeenCalledWith(null); // Auto mode passes null
    expect(mockOnUpdateBaseHourlyRate).toHaveBeenCalledWith(30);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('switches to Manual Gross Override mode and inputs manual gross pay', async () => {
    await renderWithProviders(
      <GrossAndCutoffModal
        visible={true}
        autoGrossPay={4200}
        isManualGrossOverride={false}
        currentGrossPay={4200}
        paydayDayOfMonth={25}
        workingShiftCount={14}
        totalNetMinutes={10080}
        baseHourlyRate={25}
        onSaveGrossOverride={mockOnSaveGrossOverride}
        onSavePaydayCutoff={mockOnSavePaydayCutoff}
        onClose={mockOnClose}
      />,
    );

    const manualTab = screen.getByLabelText('Manual gross pay override');
    await fireEvent.press(manualTab);

    const grossInput = screen.getByLabelText('Gross earnings amount');
    await fireEvent.changeText(grossInput, '3500');

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    expect(mockOnSaveGrossOverride).toHaveBeenCalledWith(3500);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('automatically syncs payday cutoff day from pay period end date', async () => {
    await renderWithProviders(
      <GrossAndCutoffModal
        visible={true}
        monthKey="2026-11"
        periodStartDate="2026-11-01"
        periodEndDate="2026-11-30"
        autoGrossPay={4200}
        isManualGrossOverride={true}
        currentGrossPay={3000}
        paydayDayOfMonth={25}
        workingShiftCount={14}
        totalNetMinutes={10080}
        onSaveGrossOverride={mockOnSaveGrossOverride}
        onSavePaydayCutoff={mockOnSavePaydayCutoff}
        onClose={mockOnClose}
      />,
    );

    const preset20 = screen.getByRole('button', { name: '20th to 20th preset' });
    await fireEvent.press(preset20);

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    expect(mockOnSavePaydayCutoff).toHaveBeenCalledWith(20);
  });

  it('updates pay period start and end dates via presets and steppers', async () => {
    await renderWithProviders(
      <GrossAndCutoffModal
        visible={true}
        monthKey="2026-11"
        periodStartDate="2026-11-01"
        periodEndDate="2026-11-30"
        autoGrossPay={4200}
        isManualGrossOverride={false}
        currentGrossPay={4200}
        paydayDayOfMonth={25}
        workingShiftCount={14}
        totalNetMinutes={10080}
        onSaveGrossOverride={mockOnSaveGrossOverride}
        onSavePaydayCutoff={mockOnSavePaydayCutoff}
        onSavePayPeriodDates={mockOnSavePayPeriodDates}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText('PAY PERIOD DATES')).toBeTruthy();

    // Select 25th to 25th preset
    const preset25 = screen.getByRole('button', { name: '25th to 25th preset' });
    await fireEvent.press(preset25);

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    expect(mockOnSavePayPeriodDates).toHaveBeenCalledWith('2026-10-26', '2026-11-25');
  });
});

