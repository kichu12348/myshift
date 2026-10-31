import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ShiftEditorScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { ResolvedShift, Shift, ShiftTemplate } from '@/domain';
import { useRotationStore, useShiftStore, useTemplateStore } from '@/store';

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

const mockTemplate: ShiftTemplate = {
  id: 'tpl-night',
  name: 'Night Shift',
  icon: 'moon',
  color: '#5B7DB1',
  startTime: '19:00',
  endTime: '07:00',
  breakMinutes: 45,
  hourlyRate: null,
  isOff: false,
  reminderOverride: [120, 60],
  archivedAt: null,
};

describe('ShiftEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required name field on save', async () => {
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
      notes: 'ICU Unit 4',
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

    // Change start time via modal
    await fireEvent.press(screen.getByLabelText('Change start time, currently 07:00'));
    await fireEvent.press(screen.getByLabelText('Hour 08'));
    await fireEvent.press(screen.getByText('Done'));

    // Change end time via modal
    await fireEvent.press(screen.getByLabelText('Change end time, currently 15:00'));
    await fireEvent.press(screen.getByLabelText('Hour 16'));
    await fireEvent.press(screen.getByText('Done'));

    // Add notes
    await fireEvent.changeText(screen.getByLabelText('Shift notes'), 'ICU Unit 4');

    await fireEvent.press(screen.getByText('Create Shift'));

    expect(createShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-24',
        name: 'Custom Day Shift',
        startTime: '08:00',
        endTime: '16:00',
        notes: 'ICU Unit 4',
        source: 'manual',
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    createShiftSpy.mockRestore();
  });

  it('quick-fills fields from template when tapped', async () => {
    useTemplateStore.setState({
      templates: [mockTemplate],
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
      },
    };

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    expect(screen.getByText('Night Shift')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Apply Night Shift template'));

    expect(screen.getByDisplayValue('Night Shift')).toBeTruthy();
    expect(screen.getByLabelText('Change start time, currently 19:00')).toBeTruthy();
    expect(screen.getByLabelText('Change end time, currently 07:00')).toBeTruthy();
    expect(screen.getByText('Next day (+1d)')).toBeTruthy();
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

  it('shows "Next day (+1d)" badge when end time is earlier than or equal to start time for working shift', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: { date: '2026-10-24' },
    };

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    // Initially 07:00 to 15:00, no badge
    expect(screen.queryByText('Next day (+1d)')).toBeNull();

    // Change start time to 19:00
    await fireEvent.press(screen.getByLabelText('Change start time, currently 07:00'));
    await fireEvent.press(screen.getByLabelText('Hour 19'));
    await fireEvent.press(screen.getByText('Done'));

    // Change end time to 07:00
    await fireEvent.press(screen.getByLabelText('Change end time, currently 15:00'));
    await fireEvent.press(screen.getByLabelText('Hour 07'));
    await fireEvent.press(screen.getByText('Done'));

    expect(screen.getByText('Next day (+1d)')).toBeTruthy();

    // Toggle Off day on -> schedule card hidden
    await fireEvent(screen.getByLabelText('Off shift toggle'), 'valueChange', true);
    expect(screen.queryByText('Next day (+1d)')).toBeNull();
  });

  it('supports custom reminder overrides', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
      },
    };

    const mockCreatedShift: Shift = {
      id: 'new-shift-reminders',
      date: '2026-10-24',
      templateId: null,
      name: 'Alert Shift',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 15, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      source: 'manual',
      rotationId: null,
      reminderOverride: [60],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const createShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'createShift')
      .mockResolvedValue(mockCreatedShift);

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    await fireEvent.changeText(screen.getByLabelText('Shift name'), 'Alert Shift');

    // Switch to custom reminders
    await fireEvent.press(screen.getByLabelText('Use custom reminder settings'));
    expect(screen.getByLabelText('Alert 60m before')).toBeTruthy();

    // Toggle off 30m and 15m presets, leaving only 60m
    await fireEvent.press(screen.getByLabelText('Alert 30m before'));
    await fireEvent.press(screen.getByLabelText('Alert 15m before'));

    await fireEvent.press(screen.getByText('Create Shift'));

    expect(createShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alert Shift',
        reminderOverride: [60],
      }),
    );

    createShiftSpy.mockRestore();
  });

  it('deletes an existing manual shift with two-step confirmation', async () => {
    const navigation = createMockNavigation();
    const existingShift: ResolvedShift = {
      id: 'shift-to-delete',
      date: '2026-10-24',
      templateId: null,
      name: 'Shift To Delete',
      icon: 'sun',
      color: '#F59E0B',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 7, 0).getTime(),
      endsAt: new Date(2026, 9, 24, 15, 0).getTime(),
      breakMinutes: 30,
      notes: '',
      origin: 'manual',
      rotationId: null,
      reminderOverride: null,
    };

    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.SHIFT_EDITOR> = {
      key: 'ShiftEditor',
      name: ROOT_ROUTES.SHIFT_EDITOR,
      params: {
        date: '2026-10-24',
        shift: existingShift,
      },
    };

    const deleteShiftSpy = jest
      .spyOn(useShiftStore.getState(), 'deleteShift')
      .mockResolvedValue(undefined);

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    // First tap prompts confirmation
    await fireEvent.press(screen.getByLabelText('Delete Shift'));
    expect(screen.getByText('Tap again to confirm delete')).toBeTruthy();
    expect(deleteShiftSpy).not.toHaveBeenCalled();

    // Second tap confirms
    await fireEvent.press(screen.getByLabelText('Tap again to confirm delete'));
    expect(deleteShiftSpy).toHaveBeenCalledWith('shift-to-delete');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    deleteShiftSpy.mockRestore();
  });

  it('skips a virtual rotation shift when deleted', async () => {
    const navigation = createMockNavigation();
    const mockRotationShift: ResolvedShift = {
      id: 'rot-shift-skip',
      date: '2026-10-24',
      templateId: 'tpl-1',
      name: 'Rotation To Skip',
      icon: 'moon',
      color: '#5B7DB1',
      isOff: false,
      startsAt: new Date(2026, 9, 24, 19, 0).getTime(),
      endsAt: new Date(2026, 9, 25, 7, 0).getTime(),
      breakMinutes: 45,
      notes: '',
      origin: 'rotation',
      rotationId: 'rot-999',
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

    const upsertExceptionSpy = jest
      .spyOn(useRotationStore.getState(), 'upsertException')
      .mockResolvedValue(undefined);

    await renderWithProviders(<ShiftEditorScreen navigation={navigation} route={route} />);

    // First tap
    await fireEvent.press(screen.getByLabelText('Remove from Rotation'));
    expect(screen.getByText('Tap again to confirm delete')).toBeTruthy();

    // Second tap
    await fireEvent.press(screen.getByLabelText('Tap again to confirm delete'));
    expect(upsertExceptionSpy).toHaveBeenCalledWith({
      rotationId: 'rot-999',
      date: '2026-10-24',
      kind: 'skip',
      templateId: null,
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    upsertExceptionSpy.mockRestore();
  });
});
