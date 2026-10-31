import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RotationWizardScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { Rotation, ShiftTemplate } from '@/domain';
import { useRotationStore, useTemplateStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    shifts: {
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    rotationExceptions: {
      upsert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getById: jest.fn().mockResolvedValue(null),
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
    typeof ROOT_ROUTES.ROTATION_WIZARD
  >;
}

const mockDayTemplate: ShiftTemplate = {
  id: 'tpl-day',
  name: 'Day',
  icon: 'sun',
  color: '#F59E0B',
  startTime: '07:00',
  endTime: '15:00',
  breakMinutes: 30,
  hourlyRate: null,
  isOff: false,
  reminderOverride: null,
  archivedAt: null,
};

const mockNightTemplate: ShiftTemplate = {
  id: 'tpl-night',
  name: 'Night',
  icon: 'moon',
  color: '#5B7DB1',
  startTime: '19:00',
  endTime: '07:00',
  breakMinutes: 45,
  hourlyRate: null,
  isOff: false,
  reminderOverride: null,
  archivedAt: null,
};

const mockRotation: Rotation = {
  id: 'rot-1',
  name: 'Day/Night Rotation',
  anchorDate: '2026-01-01',
  pattern: ['tpl-day', 'tpl-night'],
  startDate: '2026-01-01',
  endDate: null,
  active: true,
};

describe('RotationWizardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTemplateStore.setState({
      templates: [mockDayTemplate, mockNightTemplate],
      status: 'ready',
      error: null,
    });
  });

  it('renders rotation details with active rotation state and sequence', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    expect(screen.getByText('Repeating Rotation')).toBeTruthy();
    expect(screen.getByText('ROTATION DETAILS')).toBeTruthy();
    expect(screen.getByDisplayValue('Day/Night Rotation')).toBeTruthy();
    expect(screen.getByText('CYCLE SEQUENCE (2 DAYS)')).toBeTruthy();
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('stops/deletes a rotation with two-step danger confirmation', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const deleteSpy = jest
      .spyOn(useRotationStore.getState(), 'deleteRotation')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByLabelText('Stop Repeating Rotation'));

    expect(screen.getByText('Tap again to confirm')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Tap again to confirm stop rotation'));
    expect(deleteSpy).toHaveBeenCalledWith('rot-1');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    deleteSpy.mockRestore();
  });

  it('builds a new rotation cycle using template palette and saves it', async () => {
    useRotationStore.setState({
      rotations: [],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const createSpy = jest
      .spyOn(useRotationStore.getState(), 'createRotation')
      .mockResolvedValue(mockRotation);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    expect(screen.getByText('Repeating Rotation')).toBeTruthy();
    expect(screen.getByText('Tap templates below to build your repeating cycle')).toBeTruthy();

    // Fill in name
    await fireEvent.changeText(screen.getByLabelText('Rotation name'), 'My Custom Rotation');

    // Add days to cycle: Day, then Night
    await fireEvent.press(screen.getByLabelText('Add Day day'));
    await fireEvent.press(screen.getByLabelText('Add Night day'));

    expect(screen.getByText('CYCLE SEQUENCE (2 DAYS)')).toBeTruthy();
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();

    // Save
    await fireEvent.press(screen.getByText('Save Rotation'));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Custom Rotation',
        pattern: ['tpl-day', 'tpl-night'],
        active: true,
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    createSpy.mockRestore();
  });

  it('opens in edit mode when rotationId is provided and edits non-destructively', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const editSpy = jest
      .spyOn(useRotationStore.getState(), 'editRotationFromDate')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: { rotationId: 'rot-1' },
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    expect(screen.getByText('Repeating Rotation')).toBeTruthy();
    expect(screen.getByDisplayValue('Day/Night Rotation')).toBeTruthy();
    expect(screen.getByText('Effective From')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Rotation name'), 'Updated Rotation Name');

    await fireEvent.press(screen.getByText('Save Rotation'));

    expect(editSpy).toHaveBeenCalledWith(
      'rot-1',
      expect.objectContaining({
        name: 'Updated Rotation Name',
      }),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    editSpy.mockRestore();
  });

  it('removes slots, removes last, and clears all from sequence', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    // Initially 2 days: Day 1 and Day 2
    expect(screen.getByText('CYCLE SEQUENCE (2 DAYS)')).toBeTruthy();

    // Tap Remove Last
    await fireEvent.press(screen.getByLabelText('Remove last day from sequence'));
    expect(screen.getByText('CYCLE SEQUENCE (1 DAYS)')).toBeTruthy();

    // Tap Clear All
    await fireEvent.press(screen.getByLabelText('Clear rotation cycle pattern'));
    expect(screen.getByText('CYCLE SEQUENCE (0 DAYS)')).toBeTruthy();
    expect(screen.getByText('Tap templates below to build your repeating cycle')).toBeTruthy();
  });

  it('configures and clears end date using date picker modal', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const editSpy = jest
      .spyOn(useRotationStore.getState(), 'editRotationFromDate')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    // Initially End Date is Ongoing
    expect(screen.getByText('Ongoing')).toBeTruthy();

    // Tap End Date pill to open DatePickerModal
    await fireEvent.press(screen.getByLabelText('Rotation end date'));
    expect(screen.getByText('Rotation End Date')).toBeTruthy();

    // Select a day and confirm
    const dayButtons = screen.getAllByLabelText(/Select date/);
    if (dayButtons[15] !== undefined) {
      await fireEvent.press(dayButtons[15]);
    }
    await fireEvent.press(screen.getByLabelText('Confirm date selection'));

    // Tap Clear button to revert to Ongoing
    await fireEvent.press(screen.getByLabelText('Clear end date to ongoing'));
    expect(screen.getByText('Ongoing')).toBeTruthy();

    editSpy.mockRestore();
  });

  it('prevents saving when end date is before start date', async () => {
    useRotationStore.setState({
      rotations: [mockRotation],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    const editSpy = jest
      .spyOn(useRotationStore.getState(), 'editRotationFromDate')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.ROTATION_WIZARD> = {
      key: 'RotationWizard',
      name: ROOT_ROUTES.ROTATION_WIZARD,
      params: undefined,
    };

    await renderWithProviders(<RotationWizardScreen navigation={navigation} route={route} />);

    // Open End Date modal and select a past date
    await fireEvent.press(screen.getByLabelText('Rotation end date'));
    await fireEvent.press(screen.getByLabelText('Previous month'));
    const prevMonthDays = screen.getAllByLabelText(/Select date/);
    if (prevMonthDays[0] !== undefined) {
      await fireEvent.press(prevMonthDays[0]);
    }
    await fireEvent.press(screen.getByLabelText('Confirm date selection'));

    // Try to save
    await fireEvent.press(screen.getByText('Save Rotation'));

    expect(screen.getByText('End date cannot be before start date')).toBeTruthy();
    expect(editSpy).not.toHaveBeenCalled();

    editSpy.mockRestore();
  });
});
