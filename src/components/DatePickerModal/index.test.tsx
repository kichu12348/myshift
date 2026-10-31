import { fireEvent, screen } from '@testing-library/react-native';
import { DatePickerModal } from './index';
import { renderWithProviders } from '@/testing';
import type { LocalDate } from '@/domain';

describe('DatePickerModal', () => {
  const initialDate: LocalDate = '2026-07-09';

  it('renders month, year, and selected day matching the reference design', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        title="Select Start Date"
        selectedDate={initialDate}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Select Start Date')).toBeTruthy();
    expect(screen.getByText('July 2026')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('navigates months when chevron buttons are pressed', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        selectedDate={initialDate}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('July 2026')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText('August 2026')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('July 2026')).toBeTruthy();
  });

  it('selects a different date and calls onConfirm with the new date', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        selectedDate={initialDate}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // Select day 15 ('2026-07-15')
    await fireEvent.press(screen.getByLabelText('Select date 2026-07-15'));
    await fireEvent.press(screen.getByLabelText('Confirm date selection'));

    expect(onConfirm).toHaveBeenCalledWith('2026-07-15');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles cancel button press', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        selectedDate={initialDate}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Cancel date picker'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('handles clear/ongoing action when allowClear is true', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const onClear = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        selectedDate={initialDate}
        onConfirm={onConfirm}
        onClose={onClose}
        allowClear={true}
        onClear={onClear}
      />,
    );

    expect(screen.getByText('Ongoing')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Set to ongoing'));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables dates before minDate so they are non-pressable', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <DatePickerModal
        visible={true}
        selectedDate="2026-07-15"
        minDate="2026-07-10"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // Day 5 is before minDate ('2026-07-10')
    const day5Button = screen.getByLabelText('Select date 2026-07-05');
    expect(day5Button).toBeDisabled();

    // Pressing disabled day 5 does not select it
    await fireEvent.press(day5Button);
    await fireEvent.press(screen.getByLabelText('Confirm date selection'));

    // Should remain the original draft date ('2026-07-15'), not day 5
    expect(onConfirm).toHaveBeenCalledWith('2026-07-15');
  });
});
