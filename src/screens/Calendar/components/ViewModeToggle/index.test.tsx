import { fireEvent, screen } from '@testing-library/react-native';
import { haptics } from '@/services';
import { renderWithProviders } from '@/testing';
import { ViewModeToggle } from './index';

jest.mock('@/services', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/services');
  return {
    ...actual,
    haptics: {
      selection: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
      impact: jest.fn(),
    },
  };
});

describe('ViewModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all three view mode options', async () => {
    await renderWithProviders(<ViewModeToggle mode="month" onChange={jest.fn()} />);

    expect(screen.getByText('Month')).toBeTruthy();
    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByLabelText('Month view')).toBeTruthy();
    expect(screen.getByLabelText('Week view')).toBeTruthy();
    expect(screen.getByLabelText('Day view')).toBeTruthy();
  });

  it('indicates selected state on active mode', async () => {
    await renderWithProviders(<ViewModeToggle mode="week" onChange={jest.fn()} />);

    expect(screen.getByLabelText('Week view').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Month view').props.accessibilityState).toEqual({
      selected: false,
    });
    expect(screen.getByLabelText('Day view').props.accessibilityState).toEqual({ selected: false });
  });

  it('triggers haptics and calls onChange when tapping a different mode', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<ViewModeToggle mode="month" onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Week view'));

    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('does not trigger haptics or onChange when tapping already selected mode', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<ViewModeToggle mode="month" onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Month view'));

    expect(haptics.selection).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
