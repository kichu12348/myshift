import { fireEvent, screen } from '@testing-library/react-native';
import { InlineSegmentedControl, type SegmentedOption } from './index';
import { renderWithProviders } from '@/testing';

describe('InlineSegmentedControl', () => {
  const options: readonly SegmentedOption<string>[] = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' },
  ];

  it('renders all options and highlights the selected one', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <InlineSegmentedControl options={options} value="b" onChange={onChange} />,
    );

    expect(screen.getByText('Option A')).toBeTruthy();
    expect(screen.getByText('Option B')).toBeTruthy();
    expect(screen.getByText('Option C')).toBeTruthy();

    const selectedOption = screen.getByRole('radio', { selected: true });
    expect(selectedOption).toBeTruthy();
  });

  it('calls onChange when an unselected option is pressed', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <InlineSegmentedControl options={options} value="a" onChange={onChange} />,
    );

    const optionC = screen.getByText('Option C');
    await fireEvent.press(optionC);

    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('does not call onChange when the currently selected option is pressed', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <InlineSegmentedControl options={options} value="a" onChange={onChange} />,
    );

    const optionA = screen.getByText('Option A');
    await fireEvent.press(optionA);

    expect(onChange).not.toHaveBeenCalled();
  });
});
