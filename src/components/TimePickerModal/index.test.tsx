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

    expect(screen.getByText('Start Time')).toBeTruthy();
    expect(screen.getByText('07:00')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Hour 09'));
    await fireEvent.press(screen.getByLabelText('Minute 15'));

    expect(screen.getByText('09:15')).toBeTruthy();

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

    expect(screen.getByText('End Time')).toBeTruthy();
    expect(screen.getByText('3:00 PM')).toBeTruthy();

    // Select 11:30 AM
    await fireEvent.press(screen.getByLabelText('Hour 11'));
    await fireEvent.press(screen.getByLabelText('Minute 30'));
    await fireEvent.press(screen.getByLabelText('Period AM'));

    expect(screen.getByText('11:30 AM')).toBeTruthy();

    await fireEvent.press(screen.getByText('Done'));
    expect(onConfirm).toHaveBeenCalledWith(11 * 60 + 30);
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

  it('toggles between 5m steps and 1m steps', async () => {
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

    // Initially 5m steps
    expect(screen.queryByLabelText('Minute 07')).toBeNull();

    // Toggle to 1m steps
    await fireEvent.press(screen.getByLabelText('Toggle step size, currently 5 minute steps'));
    expect(screen.getByLabelText('Minute 07')).toBeTruthy();

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
});

