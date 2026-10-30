import { useShiftStore } from '../shiftStore';
import type { NewShift, Shift } from '@/domain';

const mockGetByDateRange = jest.fn<Promise<Shift[]>, [from: string, to: string]>();
const mockInsert = jest.fn<Promise<void>, [shift: Shift]>();
const mockUpdate = jest.fn<Promise<void>, [shift: Shift]>();
const mockDelete = jest.fn<Promise<void>, [id: string]>();
const mockGetById = jest.fn<Promise<Shift | null>, [id: string]>();

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      getByDateRange: (from: string, to: string) => mockGetByDateRange(from, to),
      getById: (id: string) => mockGetById(id),
      insert: (shift: Shift) => mockInsert(shift),
      update: (shift: Shift) => mockUpdate(shift),
      delete: (id: string) => mockDelete(id),
    },
  },
}));

jest.mock('@/services', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/services');
  return {
    ...actual,
    createId: () => 'generated-test-id',
    requestReminderSync: jest.fn().mockResolvedValue(undefined),
  };
});

describe('shiftStore conflict resolution', () => {
  const testDate = '2026-10-24';

  const baseDayInput: NewShift = {
    date: testDate,
    templateId: 'tpl-day',
    name: 'Day Shift',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    notes: '',
    source: 'manual',
    rotationId: null,
    reminderOverride: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetByDateRange.mockResolvedValue([]);
    mockInsert.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockGetById.mockResolvedValue(null);

    useShiftStore.setState({
      shifts: [],
      range: null,
      status: 'ready',
      error: null,
    });
  });

  it('deletes conflicting Day shift when adding another Day shift on the same date', async () => {
    const existingDay: Shift = {
      id: 'existing-day-id',
      date: testDate,
      templateId: 'tpl-day',
      name: 'Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockGetByDateRange.mockResolvedValue([existingDay]);

    await useShiftStore.getState().createShift(baseDayInput);

    expect(mockDelete).toHaveBeenCalledWith('existing-day-id');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-test-id',
        date: testDate,
        name: 'Day Shift',
      }),
    );
  });

  it('deletes existing Day shift when adding an Off shift', async () => {
    const existingDay: Shift = {
      id: 'existing-day-id',
      date: testDate,
      templateId: 'tpl-day',
      name: 'Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockGetByDateRange.mockResolvedValue([existingDay]);

    await useShiftStore.getState().createShift({
      ...baseDayInput,
      templateId: 'tpl-off',
      name: 'Off Day',
      icon: 'home',
      isOff: true,
      startTime: '00:00',
      endTime: '00:00',
    });

    expect(mockDelete).toHaveBeenCalledWith('existing-day-id');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        isOff: true,
      }),
    );
  });

  it('deletes existing Off shift when adding a Day shift', async () => {
    const existingOff: Shift = {
      id: 'existing-off-id',
      date: testDate,
      templateId: 'tpl-off',
      name: 'Off Day',
      icon: 'home',
      color: '#94A3B8',
      isOff: true,
      startsAt: new Date(2026, 9, 24, 0, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 0, 0).getTime(),
      breakMinutes: 0,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockGetByDateRange.mockResolvedValue([existingOff]);

    await useShiftStore.getState().createShift(baseDayInput);

    expect(mockDelete).toHaveBeenCalledWith('existing-off-id');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('keeps both Day (07:00-19:00) and Night (19:00-07:00) shifts without deleting', async () => {
    const existingDay: Shift = {
      id: 'existing-day-id',
      date: testDate,
      templateId: 'tpl-day',
      name: 'Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockGetByDateRange.mockResolvedValue([existingDay]);

    const nightInput: NewShift = {
      ...baseDayInput,
      templateId: 'tpl-night',
      name: 'Night Shift',
      icon: 'moon',
      startTime: '19:00',
      endTime: '07:00',
    };

    await useShiftStore.getState().createShift(nightInput);

    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Night Shift',
      }),
    );
  });

  it('excludes self when updating an existing shift', async () => {
    const shiftToUpdate: Shift = {
      id: 'shift-1',
      date: testDate,
      templateId: 'tpl-day',
      name: 'Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockGetById.mockResolvedValue(shiftToUpdate);
    mockGetByDateRange.mockResolvedValue([shiftToUpdate]);

    await useShiftStore.getState().updateShift('shift-1', {
      ...baseDayInput,
      notes: 'Updated notes',
    });

    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'shift-1',
        notes: 'Updated notes',
      }),
    );
  });
});

