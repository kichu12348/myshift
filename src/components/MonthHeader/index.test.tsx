import { fireEvent, screen } from '@testing-library/react-native';
import { MonthHeader } from './index';
import { renderWithProviders } from '@/testing';

describe('MonthHeader Component', () => {
  const onPrevious = jest.fn();
  const onNext = jest.fn();
  const onToday = jest.fn();
  const onStatsPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, stats subtitle, and compact today button', async () => {
    await renderWithProviders(
      <MonthHeader
        title="October 2026"
        subtitle="18 shifts · 156h"
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        onStatsPress={onStatsPress}
      />,
    );

    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getByText('18 shifts · 156h')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to today' })).toBeTruthy();
    expect(screen.queryByLabelText('Rotations')).toBeNull();
  });

  it('triggers onToday when Today button is pressed', async () => {
    await renderWithProviders(
      <MonthHeader
        title="October 2026"
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Go to today' }));
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it('triggers onPrevious and onNext buttons', async () => {
    await renderWithProviders(
      <MonthHeader
        title="October 2026"
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Previous month'));
    expect(onPrevious).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('triggers onStatsPress when subtitle is pressed', async () => {
    await renderWithProviders(
      <MonthHeader
        title="October 2026"
        subtitle="18 shifts · 156h"
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        onStatsPress={onStatsPress}
      />,
    );

    await fireEvent.press(screen.getByLabelText('View stats: 18 shifts · 156h'));
    expect(onStatsPress).toHaveBeenCalledTimes(1);
  });
});
