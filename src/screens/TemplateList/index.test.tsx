import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { TemplateListScreen } from './index';
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
    typeof ROOT_ROUTES.TEMPLATE_LIST
  >;
}

const mockActiveTemplate: ShiftTemplate = {
  id: 'tpl-day',
  name: 'Day Shift',
  icon: 'sun',
  color: '#F59E0B',
  startTime: '07:00',
  endTime: '15:00',
  breakMinutes: 30,
  hourlyRate: 40,
  isOff: false,
  reminderOverride: null,
  archivedAt: null,
};

const mockArchivedTemplate: ShiftTemplate = {
  id: 'tpl-old',
  name: 'Old Rotation',
  icon: 'briefcase',
  color: '#94A3B8',
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 60,
  hourlyRate: null,
  isOff: false,
  reminderOverride: null,
  archivedAt: 123456789,
};

describe('TemplateListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders active templates and navigates to editor when row is pressed', async () => {
    useTemplateStore.setState({
      templates: [mockActiveTemplate],
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_LIST> = {
      key: 'TemplateList',
      name: ROOT_ROUTES.TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<TemplateListScreen navigation={navigation} route={route} />);

    expect(screen.getByText('ACTIVE TEMPLATES (1)')).toBeTruthy();
    expect(screen.getByText('Day Shift')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Edit Day Shift template'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROOT_ROUTES.TEMPLATE_EDITOR, {
      templateId: 'tpl-day',
    });
  });

  it('navigates to editor when New button is pressed', async () => {
    useTemplateStore.setState({
      templates: [mockActiveTemplate],
      status: 'ready',
      error: null,
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_LIST> = {
      key: 'TemplateList',
      name: ROOT_ROUTES.TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<TemplateListScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByLabelText('Add template'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROOT_ROUTES.TEMPLATE_EDITOR, {});
  });

  it('toggles archived templates list and allows restoring', async () => {
    useTemplateStore.setState({
      templates: [mockArchivedTemplate],
      status: 'ready',
      error: null,
    });

    const unarchiveSpy = jest
      .spyOn(useTemplateStore.getState(), 'unarchiveTemplate')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.TEMPLATE_LIST> = {
      key: 'TemplateList',
      name: ROOT_ROUTES.TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<TemplateListScreen navigation={navigation} route={route} />);

    expect(screen.getByText('Show Archived (1)')).toBeTruthy();
    expect(screen.queryByText('Old Rotation')).toBeNull();

    // Toggle switch
    await fireEvent(screen.getByLabelText('Toggle show archived templates'), 'valueChange', true);

    expect(screen.getByText('Old Rotation')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Restore Old Rotation'));
    expect(unarchiveSpy).toHaveBeenCalledWith('tpl-old');

    unarchiveSpy.mockRestore();
  });
});
