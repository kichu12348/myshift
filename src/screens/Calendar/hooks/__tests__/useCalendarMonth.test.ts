import { act, renderHook } from '@testing-library/react-native';
import type { LocalDate } from '@/domain';
import { useCalendarMonth } from '../useCalendarMonth';

describe('useCalendarMonth', () => {
  const initialDate: LocalDate = '2026-10-24';

  it('initializes with default month viewMode and synced month/date', async () => {
    const { result } = await renderHook(() => useCalendarMonth(initialDate));

    expect(result.current.viewMode).toBe('month');
    expect(result.current.selectedDate).toBe('2026-10-24');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 10 });
  });

  it('updates viewMode via setViewMode', async () => {
    const { result } = await renderHook(() => useCalendarMonth(initialDate));

    await act(() => {
      result.current.setViewMode('week');
    });
    expect(result.current.viewMode).toBe('week');

    await act(() => {
      result.current.setViewMode('day');
    });
    expect(result.current.viewMode).toBe('day');
  });

  it('navigates ±1 month in month viewMode', async () => {
    const { result } = await renderHook(() => useCalendarMonth(initialDate));

    await act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 9 });
    expect(result.current.selectedDate).toBe('2026-10-24');

    await act(() => {
      result.current.goToNext();
    });
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 10 });
  });

  it('navigates ±7 days in week viewMode and keeps visibleMonth synced', async () => {
    const { result } = await renderHook(() => useCalendarMonth(initialDate));

    await act(() => {
      result.current.setViewMode('week');
    });

    await act(() => {
      result.current.goToNext();
    });
    // 2026-10-24 + 7 days = 2026-10-31
    expect(result.current.selectedDate).toBe('2026-10-31');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 10 });

    await act(() => {
      result.current.goToNext();
    });
    // 2026-10-31 + 7 days = 2026-11-07
    expect(result.current.selectedDate).toBe('2026-11-07');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 11 });

    await act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.selectedDate).toBe('2026-10-31');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 10 });
  });

  it('navigates ±1 day in day viewMode and keeps visibleMonth synced', async () => {
    const endOfMonthDate: LocalDate = '2026-10-31';
    const { result } = await renderHook(() => useCalendarMonth(endOfMonthDate));

    await act(() => {
      result.current.setViewMode('day');
    });

    await act(() => {
      result.current.goToNext();
    });
    expect(result.current.selectedDate).toBe('2026-11-01');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 11 });

    await act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.selectedDate).toBe('2026-10-31');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 10 });
  });

  it('goToDate and selectDate update state appropriately', async () => {
    const { result } = await renderHook(() => useCalendarMonth(initialDate));

    await act(() => {
      result.current.goToDate('2026-12-15');
    });
    expect(result.current.selectedDate).toBe('2026-12-15');
    expect(result.current.visibleMonth).toEqual({ year: 2026, month: 12 });

    await act(() => {
      result.current.selectDate('2027-01-05');
    });
    expect(result.current.selectedDate).toBe('2027-01-05');
    expect(result.current.visibleMonth).toEqual({ year: 2027, month: 1 });
  });
});
