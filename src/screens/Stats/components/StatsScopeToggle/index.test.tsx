import { fireEvent, screen } from '@testing-library/react-native';
import { StatsScopeToggle } from './index';
import { renderWithProviders } from '@/testing';
import { haptics } from '@/services';

jest.mock('@/services', () => ({
  haptics: {
    selection: jest.fn(),
  },
}));

describe('StatsScopeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Up to Now" and "Full Month" options and marks selected one', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<StatsScopeToggle scope="to-date" onChange={onChange} />);

    expect(screen.getByText('Up to Now')).toBeTruthy();
    expect(screen.getByText('Full Month')).toBeTruthy();

    const selectedOption = screen.getByRole('radio', { selected: true });
    expect(selectedOption).toBeTruthy();
    expect(screen.getByLabelText('Calculate stats up to now')).toBe(selectedOption);
  });

  it('calls onChange and triggers haptics when unselected option is pressed', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<StatsScopeToggle scope="to-date" onChange={onChange} />);

    const fullMonthButton = screen.getByLabelText('Calculate stats for full month');
    await fireEvent.press(fullMonthButton);

    expect(onChange).toHaveBeenCalledWith('full-month');
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it('does not call onChange or trigger haptics when currently selected option is pressed', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<StatsScopeToggle scope="to-date" onChange={onChange} />);

    const upToNowButton = screen.getByLabelText('Calculate stats up to now');
    await fireEvent.press(upToNowButton);

    expect(onChange).not.toHaveBeenCalled();
    expect(haptics.selection).not.toHaveBeenCalled();
  });
});

