import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ShiftEditorScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { ResolvedShift, Shift } from '@/domain';
import { useShiftStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getById: jest.fn().mockResolvedValue(null),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      upsert: jest.fn().mockResolvedValue(undefined),
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

function createMockNavigation() {
  const nav = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    reset: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(),
    getState: jest.fn(),
    getParent: jest.fn(),
    setOptions: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
  };
  return nav as unknown as NativeStackNavigationProp<
    RootStackParamList,
    typeof ROOT_ROUTES.SHIFT_EDITOR
  >;
}

describe('ShiftEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields and time formats on save', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
      },
    };

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    // Save with empty name
    const createButton = screen.getByText('Create Shift');
    await fireEvent.press(createButton);

    expect(screen.getByText('Shift name is required')).toBeTruthy();

    // Type a name but set invalid start time
    await fireEvent.changeText(screen.getByLabelText('Shift name'), 'Day Shift');
    await fireEvent.changeText(screen.getByLabelText('Start time'), '25:99');
    await fireEvent.press(createButton);

    expect(screen.getByText('Start time must be in HH:mm format (e.g. 07:00)')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('creates a new manual shift when valid', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
      },
    };

    const mockCreatedShift: Shift = {
      id: 'new-shift-1',
      date: '2026-10-24',
      templateId: null,
      name: 'Custom Day Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 8, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 16, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: null,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const createShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'createShift')
      .mockResolvedValue(mockCreatedShift);

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    await fireEvent.changeText(screen.getByLabelText('Shift name'), 'Custom Day Shift');
    await fireEvent.changeText(screen.getByLabelText('Start time'), '08:00');
    await fireEvent.changeText(screen.getByLabelText('End time'), '16:00');

    await fireEvent.press(screen.getByText('Create Shift'));

    expect(createShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-24',
        name: 'Custom Day Shift',
        startTime: '08:00',
        endTime: '16:00',
        source: 'manual',
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    createShiftSpy.mockRestore();
  });

  it('converts a virtual rotation shift into a rotation_override stored shift on save', async () => {
    const navigation = createMockNavigation();
    const mockRotationShift: ResolvedShift = {
      id: 'rot-1-2026-10-24',
      date: '2026-10-24',
      templateId: 'tpl-night',
      name: 'Night Rotation',
      icon: 'moon',
      color: '#5B7DB1',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      endsAt: new Date(2026, 9, 25, 7, 0).getTime(),
      breakMinutes: 45,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-123',
      reminderOverride: null,
    };

    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
        shift: mockRotationShift,
      },
    };

    const mockCreatedOverride: Shift = {
      ...mockRotationShift,
      id: 'override-1',
      source: 'rotation_override',
      createdAt: 1000,
      updatedAt: 1000,
    };

    const createShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'createShift')
      .mockResolvedValue(mockCreatedOverride);

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    expect(screen.getByDisplayValue('Night Rotation')).toBeTruthy();

    // Change the name to custom override
    await fireEvent.changeText(screen.getByLabelText('Shift name'), 'Overridden Night Shift');

    await fireEvent.press(screen.getByText('Save Changes'));

    expect(createShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-24',
        name: 'Overridden Night Shift',
        source: 'rotation_override',
        rotationId: 'rot-123',
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    createShiftSpy.mockRestore();
  });
});
