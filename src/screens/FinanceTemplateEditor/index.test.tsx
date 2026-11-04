import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { FinanceTemplateEditorScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { FinanceTemplate } from '@/domain';
import { useFinanceStore } from '@/store';

jest.mock('@/db', () => ({
  repositories: {
    finance: {
      getTemplates: jest.fn().mockResolvedValue([]),
      upsertTemplate: jest.fn().mockResolvedValue(undefined),
      deleteTemplate: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

function createMockNavigation(): NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR
> {
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
    typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR
  >;
}

const mockTemplate: FinanceTemplate = {
  id: 'tpl-rent-1',
  name: 'Apartment Rent',
  category: 'expense',
  valueMode: 'fixed',
  value: 1200,
  icon: 'home',
  color: '#5B7DB1',
  sortOrder: 1,
  isActive: true,
};

describe('FinanceTemplateEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates template name and amount on save', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR> = {
      key: 'FinanceTemplateEditor',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR,
      params: {},
    };

    await renderWithProviders(<FinanceTemplateEditorScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByText('Create Template'));

    expect(screen.getByText('Template name is required')).toBeTruthy();
    expect(screen.getByText('Enter a valid positive amount or percentage')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('creates a new finance template when valid', async () => {
    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR> = {
      key: 'FinanceTemplateEditor',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR,
      params: {},
    };

    const upsertSpy = jest
      .spyOn(useFinanceStore.getState(), 'upsertFinanceTemplate')
      .mockResolvedValue(undefined);

    await renderWithProviders(<FinanceTemplateEditorScreen navigation={navigation} route={route} />);

    await fireEvent.changeText(screen.getByLabelText('Template name'), 'Gym Membership');
    await fireEvent.changeText(screen.getByLabelText('Template amount'), '60');

    await fireEvent.press(screen.getByText('Create Template'));

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Gym Membership',
        value: 60,
        valueMode: 'fixed',
        category: 'expense',
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    upsertSpy.mockRestore();
  });

  it('edits an existing finance template when templateId is provided', async () => {
    useFinanceStore.setState({
      templates: [mockTemplate],
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR> = {
      key: 'FinanceTemplateEditor',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR,
      params: { templateId: 'tpl-rent-1' },
    };

    const upsertSpy = jest
      .spyOn(useFinanceStore.getState(), 'upsertFinanceTemplate')
      .mockResolvedValue(undefined);

    await renderWithProviders(<FinanceTemplateEditorScreen navigation={navigation} route={route} />);

    expect(screen.getByDisplayValue('Apartment Rent')).toBeTruthy();
    expect(screen.getByDisplayValue('1200')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Template name'), 'House Rent');
    await fireEvent.changeText(screen.getByLabelText('Template amount'), '1400');

    await fireEvent.press(screen.getByText('Save Template'));

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tpl-rent-1',
        name: 'House Rent',
        value: 1400,
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    upsertSpy.mockRestore();
  });

  it('deletes an existing template with two-step confirmation', async () => {
    useFinanceStore.setState({
      templates: [mockTemplate],
    });

    const deleteSpy = jest
      .spyOn(useFinanceStore.getState(), 'deleteFinanceTemplate')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR> = {
      key: 'FinanceTemplateEditor',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR,
      params: { templateId: 'tpl-rent-1' },
    };

    await renderWithProviders(<FinanceTemplateEditorScreen navigation={navigation} route={route} />);

    // First tap prompts confirmation
    await fireEvent.press(screen.getByLabelText('Delete Template'));
    expect(screen.getByText('Tap again to confirm delete')).toBeTruthy();
    expect(deleteSpy).not.toHaveBeenCalled();

    // Second tap executes delete
    await fireEvent.press(screen.getByLabelText('Tap again to confirm delete'));
    expect(deleteSpy).toHaveBeenCalledWith('tpl-rent-1');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);

    deleteSpy.mockRestore();
  });
});

