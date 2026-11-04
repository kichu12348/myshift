import { fireEvent, screen } from '@testing-library/react-native';
import { GrossAndCutoffModal } from './index';
import { renderWithProviders } from '@/testing';

describe('GrossAndCutoffModal', () => {
  const mockOnSaveGrossOverride = jest.fn();
  const mockOnSavePaydayCutoff = jest.fn();
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

  it('selects cutoff day via quick presets and day pills', async () => {
    await renderWithProviders(
      <GrossAndCutoffModal
        visible={true}
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

    // Press quick preset 15th
    const preset15 = screen.getByRole('button', { name: 'Preset 15th' });
    await fireEvent.press(preset15);

    // Or select Day 28th
    const day28 = screen.getByRole('button', { name: 'Day 28th' });
    await fireEvent.press(day28);

    const saveButton = screen.getByRole('button', { name: 'Save Override' });
    await fireEvent.press(saveButton);

    expect(mockOnSavePaydayCutoff).toHaveBeenCalledWith(28);
  });
});

