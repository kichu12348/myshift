import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { FinanceTemplateListScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { FinanceTemplate } from '@/domain';
import { useFinanceStore } from '@/store';

const mockGetTemplates = jest.fn<Promise<FinanceTemplate[]>, []>();
const mockUpsertTemplate = jest.fn<Promise<void>, [template: FinanceTemplate]>();
const mockDeleteTemplate = jest.fn<Promise<void>, [id: string]>();
const mockInsertMonthlyEntries = jest.fn<Promise<void>, [entries: ReadonlyArray<unknown>]>();

jest.mock('@/db', () => ({
  repositories: {
    finance: {
      getTemplates: () => mockGetTemplates(),
      upsertTemplate: (template: FinanceTemplate) => mockUpsertTemplate(template),
      deleteTemplate: (id: string) => mockDeleteTemplate(id),
      insertMonthlyEntries: (entries: ReadonlyArray<unknown>) => mockInsertMonthlyEntries(entries),
      getPayCycleProfile: jest.fn().mockResolvedValue({
        isConfigured: false,
        paydayDayOfMonth: 25,
        anchorPaydayDate: '',
        cycleLengthUnit: 'financial-month',
        cycleLengthDays: 28,
      }),
      getMonthlyConfig: jest.fn().mockResolvedValue(null),
      getMonthlyEntries: jest.fn().mockResolvedValue([]),
    },
  },
}));

function createMockNavigation(): NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST
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
    typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST
  >;
}

const mockTaxTemplate: FinanceTemplate = {
  id: 'tpl-tax-1',
  name: 'Federal Income Tax',
  category: 'tax',
  valueMode: 'percentage',
  value: 20,
  icon: 'percent',
  color: '#EF4444',
  sortOrder: 1,
  isActive: true,
};

const mockExpenseTemplate: FinanceTemplate = {
  id: 'tpl-rent-1',
  name: 'Apartment Rent',
  category: 'expense',
  valueMode: 'fixed',
  value: 1200,
  icon: 'home',
  color: '#5B7DB1',
  sortOrder: 2,
  isActive: true,
};

describe('FinanceTemplateListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTemplates.mockImplementation(() =>
      Promise.resolve(useFinanceStore.getState().templates),
    );
  });

  it('renders taxes and recurring allocations, navigating to editor on row press', async () => {
    useFinanceStore.setState({
      templates: [mockTaxTemplate, mockExpenseTemplate],
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST> = {
      key: 'FinanceTemplateList',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<FinanceTemplateListScreen navigation={navigation} route={route} />);

    expect(screen.getByText('TAXES (1)')).toBeTruthy();
    expect(screen.getByText('Federal Income Tax')).toBeTruthy();
    expect(screen.getByText('20% of gross')).toBeTruthy();

    expect(screen.getByText('RECURRING ALLOCATIONS (1)')).toBeTruthy();
    expect(screen.getByText('Apartment Rent')).toBeTruthy();
    expect(screen.getByText('Fixed · $1,200.00')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Edit Federal Income Tax template'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {
      templateId: 'tpl-tax-1',
    });
  });

  it('navigates to editor when New button is pressed', async () => {
    useFinanceStore.setState({
      templates: [mockTaxTemplate],
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST> = {
      key: 'FinanceTemplateList',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<FinanceTemplateListScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByLabelText('Add finance template'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROOT_ROUTES.FINANCE_TEMPLATE_EDITOR, {});
  });

  it('calls apply templates to current month on button press', async () => {
    useFinanceStore.setState({
      templates: [mockTaxTemplate, mockExpenseTemplate],
    });

    const resetSpy = jest
      .spyOn(useFinanceStore.getState(), 'resetMonthToDefaultTemplates')
      .mockResolvedValue(undefined);

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST> = {
      key: 'FinanceTemplateList',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<FinanceTemplateListScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByText('Apply Templates to Current Month'));

    expect(resetSpy).toHaveBeenCalledTimes(1);
    resetSpy.mockRestore();
  });

  it('renders empty state when there are no templates', async () => {
    useFinanceStore.setState({
      templates: [],
    });

    const navigation = createMockNavigation();
    const route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.FINANCE_TEMPLATE_LIST> = {
      key: 'FinanceTemplateList',
      name: ROOT_ROUTES.FINANCE_TEMPLATE_LIST,
      params: undefined,
    };

    await renderWithProviders(<FinanceTemplateListScreen navigation={navigation} route={route} />);

    expect(screen.getByText('No finance templates configured')).toBeTruthy();
    expect(screen.getByText('Create First Template')).toBeTruthy();
  });
});
