import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { TemplateEditorScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { ShiftTemplate } from '@/domain';
import { useTemplateStore } from '@/store';

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
      getByRange: jest.fn().mockResolvedValue([]),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      setArchived: jest.fn().mockResolvedValue(undefined),
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
    typeof ROOT_ROUTES.TEMPLATE_EDITOR
  >;
}

const mockTemplate: ShiftTemplate = {
  id: 'tpl-evening',
  name: 'Evening Shift',
  icon: 'sunset',
  color: '#F97316',
  startTime: '15:00',
  endTime: '23:00',
  breakMinutes: 30,
  hourlyRate: 38.5,
  isOff: false,
  reminderOverride: null,
  archivedAt: null,
};

describe('TemplateEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates template name requirement on save', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_EDITOR> = {
      key: 'TemplateEditor',
      name: ROOT_ROUTES.TEMPLATE_EDITOR,
      params: {},
    };

    await renderWithProviders(<TemplateEditorScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByText('Create Template'));
    expect(screen.getByText('Template name is required')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('creates a new shift template when valid', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_EDITOR> = {
      key: 'TemplateEditor',
      name: ROOT_ROUTES.TEMPLATE_EDITOR,
      params: {},
    };

    const created: ShiftTemplate = {
      id: 'tpl-created',
      name: 'Custom Day',
      icon: 'sun',
      color: '#F59E0B',
      startTime: '07:00',
      endTime: '15:00',
      breakMinutes: 30,
      hourlyRate: 35,
      isOff: false,
      reminderOverride: null,
      archivedAt: null,
    };

    const createSpy = jest
      .spyOn(useTemplateStore.getState(), 'createTemplate')
      .mockResolvedValue(created);

    await renderWithProviders(<TemplateEditorScreen navigation={navigation} route={route} />);

    await fireEvent.changeText(screen.getByLabelText('Template name'), 'Custom Day');
    await fireEvent.changeText(screen.getByLabelText('Hourly rate'), '35');

    await fireEvent.press(screen.getByText('Create Template'));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Day',
        hourlyRate: 35,
        startTime: '07:00',
        endTime: '15:00',
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    createSpy.mockRestore();
  });

  it('edits an existing shift template when templateId is provided', async () => {
    useTemplateStore.setState({
      templates: [mockTemplate],
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_EDITOR> = {
      key: 'TemplateEditor',
      name: ROOT_ROUTES.TEMPLATE_EDITOR,
      params: { templateId: 'tpl-evening' },
    };

    const updateSpy = jest
      .spyOn(useTemplateStore.getState(), 'updateTemplate')
      .mockResolvedValue(undefined);

    await renderWithProviders(<TemplateEditorScreen navigation={navigation} route={route} />);

    expect(screen.getByDisplayValue('Evening Shift')).toBeTruthy();
    expect(screen.getByDisplayValue('38.5')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Template name'), 'Evening Shift (Charge)');
    await fireEvent.changeText(screen.getByLabelText('Hourly rate'), '42');

    await fireEvent.press(screen.getByText('Save Template'));

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tpl-evening',
        name: 'Evening Shift (Charge)',
        hourlyRate: 42,
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
  });
});
