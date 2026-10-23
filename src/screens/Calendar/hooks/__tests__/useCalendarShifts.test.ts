import { renderHook } from '@testing-library/react-native';
import { useCalendarShifts } from '../useCalendarShifts';
import { useRotationStore, useShiftStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      getByRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      getByRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe('useCalendarShifts', () => {
  it('triggers store range loading and returns resolved days map for grid dates', async () => {
    const loadRangeSpy = jest
      .spyOn(useShiftStore.getState(), 'loadRange')
      .mockImplementation(async () => {});
    const loadExceptionsSpy = jest
      .spyOn(useRotationStore.getState(), 'loadExceptions')
      .mockImplementation(async () => {});

    const { result } = await renderHook(() =>
      useCalendarShifts({ year: 2026, month: 10 }, 0),
    );

    expect(loadRangeSpy).toHaveBeenCalledWith('2026-09-27', '2026-11-07');
    expect(loadExceptionsSpy).toHaveBeenCalledWith('2026-09-27', '2026-11-07');
    expect(result.current.has('2026-10-24')).toBe(true);

    loadRangeSpy.mockRestore();
    loadExceptionsSpy.mockRestore();
  });
});
