import { fireEvent, screen } from '@testing-library/react-native';
import { TimePickerModal } from './index';
import { renderWithProviders } from '@/testing';

describe('TimePickerModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects hour and minute in 24h mode and calls onConfirm with correct minutes', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="Start Time"
        initialMinutes={420} // 07:00
        timeFormat="24h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // Zone 1: Header uppercase title
    expect(screen.getByText('START TIME')).toBeTruthy();

    // Zone 2: Hero digital readout initial values
    expect(screen.getByLabelText('Selected hour 07')).toBeTruthy();
    expect(screen.getByLabelText('Selected minute 00')).toBeTruthy();

    // Zone 3: Select hour and minute
    await fireEvent.press(screen.getByLabelText('Hour 09'));
    await fireEvent.press(screen.getByLabelText('Minute 15'));

    // Digital readout updates
    expect(screen.getByLabelText('Selected hour 09')).toBeTruthy();
    expect(screen.getByLabelText('Selected minute 15')).toBeTruthy();

    // Zone 4: Done button
    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(9 * 60 + 15);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects hour, minute, and period in 12h mode', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="End Time"
        initialMinutes={900} // 15:00 = 3:00 PM
        timeFormat="12h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('END TIME')).toBeTruthy();
    expect(screen.getByLabelText('Selected hour 03')).toBeTruthy();
    expect(screen.getByLabelText('Selected minute 00')).toBeTruthy();
    expect(screen.getByLabelText('Period PM')).toBeTruthy();

    // Select 11:30 AM
    await fireEvent.press(screen.getByLabelText('Hour 11'));
    await fireEvent.press(screen.getByLabelText('Minute 30'));
    await fireEvent.press(screen.getByLabelText('Period AM'));

    expect(screen.getByLabelText('Selected hour 11')).toBeTruthy();
    expect(screen.getByLabelText('Selected minute 30')).toBeTruthy();
    expect(screen.getByLabelText('Period AM')).toBeTruthy();

    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(11 * 60 + 30);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('correctly maps 12 AM and 12 PM in 12h mode', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="Time"
        initialMinutes={720} // 12:00 PM
        timeFormat="12h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // 12 PM -> 720 minutes
    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(720);

    onConfirm.mockClear();

    // Switch to 12 AM -> 0 minutes
    await fireEvent.press(screen.getByLabelText('Period AM'));
    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(0);
  });

  it('allows selecting any discrete minute from 00 to 59 without step intervals', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="Start Time"
        initialMinutes={420}
        timeFormat="24h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // Direct access to non-5m-interval numbers
    expect(screen.getByLabelText('Minute 07')).toBeTruthy();
    expect(screen.getByLabelText('Minute 43')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Minute 07'));
    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(7 * 60 + 7);
  });

  it('triggers onClose when Cancel is pressed', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="Start Time"
        initialMinutes={420}
        timeFormat="24h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('triggers onClose when the backdrop is pressed outside the card', async () => {
    await renderWithProviders(
      <TimePickerModal
        visible={true}
        title="Start Time"
        initialMinutes={420}
        timeFormat="24h"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Close time picker'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
