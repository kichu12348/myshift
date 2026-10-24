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

  it('renders rotation overview list with active rotation cards', async () => {
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

    expect(screen.getByText('Rotations')).toBeTruthy();
    expect(screen.getByText('Day/Night Rotation')).toBeTruthy();
    expect(screen.getByText(/2-day cycle/)).toBeTruthy();
  });

  it('deletes a rotation with two-step danger confirmation', async () => {
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

    await fireEvent.press(screen.getByLabelText('Delete Day/Night Rotation'));

    expect(screen.getByText('Delete rotation "Day/Night Rotation"?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Confirm delete Day/Night Rotation'));
    expect(deleteSpy).toHaveBeenCalledWith('rot-1');

    deleteSpy.mockRestore();
  });

  it('builds a new rotation cycle using template chips and saves it', async () => {
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

    // Click "Create First Rotation"
    await fireEvent.press(screen.getByLabelText('Create first rotation'));

    expect(screen.getByText('New Rotation')).toBeTruthy();

    // Fill in name
    await fireEvent.changeText(screen.getByLabelText('Rotation name'), 'My Custom Rotation');

    // Add days to cycle: Day, then Night
    await fireEvent.press(screen.getByLabelText('Add Day day'));
    await fireEvent.press(screen.getByLabelText('Add Night day'));

    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();

    // Save
    await fireEvent.press(screen.getByText('Create Rotation'));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Custom Rotation',
        pattern: ['tpl-day', 'tpl-night'],
      }),
    );

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

    expect(screen.getByText('Edit Rotation')).toBeTruthy();
    expect(screen.getByDisplayValue('Day/Night Rotation')).toBeTruthy();
    expect(screen.getByLabelText('Effective from date')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Rotation name'), 'Updated Rotation Name');

    await fireEvent.press(screen.getByText('Save Changes'));

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
});
