import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/testing';
import {
  SettingsDropdownRow,
  type SettingsDropdownOption,
} from './index';

describe('SettingsDropdownRow', () => {
  const options: readonly SettingsDropdownOption<number>[] = [
    { value: 1, label: 'Monday', description: 'ISO 8601 week' },
    { value: 0, label: 'Sunday', description: 'Traditional week' },
  ];

  it('renders collapsed state with title, subtitle, and collapsed accessibility state', async () => {
    const handleSelect = jest.fn();

    await renderWithProviders(
      <SettingsDropdownRow
        icon="calendar"
        title="Start of Week"
        subtitle="Monday"
        options={options}
        selectedValue={1}
        onSelect={handleSelect}
      />
    );

    expect(screen.getByText('Start of Week')).toBeTruthy();
    expect(screen.getByText('Monday')).toBeTruthy();

    const trigger = screen.getByRole('button', { name: 'Start of Week' });
    expect(trigger.props.accessibilityState).toEqual({ expanded: false });

    // Options shouldn't be rendered when collapsed
    expect(screen.queryByText('ISO 8601 week')).toBeNull();
    expect(screen.queryByText('Traditional week')).toBeNull();
  });

  it('expands options on tap and allows selecting an option', async () => {
    const handleSelect = jest.fn();

    await renderWithProviders(
      <SettingsDropdownRow
        icon="calendar"
        title="Start of Week"
        subtitle="Monday"
        options={options}
        selectedValue={1}
        onSelect={handleSelect}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Start of Week' });
    await fireEvent.press(trigger);

    // Options should now be visible
    expect(screen.getByText('ISO 8601 week')).toBeTruthy();
    expect(screen.getByText('Traditional week')).toBeTruthy();
    expect(trigger.props.accessibilityState).toEqual({ expanded: true });

    // Tap Sunday option
    const sundayRadio = screen.getByRole('radio', {
      name: 'Sunday, Traditional week',
    });
    expect(sundayRadio.props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(sundayRadio);

    expect(handleSelect).toHaveBeenCalledWith(0);

    // After selection, dropdown collapses
    expect(screen.queryByText('Traditional week')).toBeNull();
  });
});
