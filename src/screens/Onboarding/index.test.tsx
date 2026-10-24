import { fireEvent, screen } from '@testing-library/react-native';
import { OnboardingScreen } from './index';
import { renderWithProviders } from '@/testing';
import { ROOT_ROUTES } from '@/constants/routes';
import { DEFAULT_SHIFT_TEMPLATES } from '@/constants';
import { useRotationStore, useSettingsStore, useTemplateStore } from '@/store';
import { expoPermissionChecker } from '@/services';
import { repositories } from '@/db';
import type { AppSettings } from '@/domain';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(false);

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
      canGoBack: mockCanGoBack,
    }),
  };
});

jest.mock('@/db', () => ({
  repositories: {
    settings: {
      getOrCreate: jest.fn().mockResolvedValue({
        themeMode: 'dark',
        weekStart: 1,
        timeFormat: '24h',
        remindersEnabled: true,
        defaultMinutesBefore: [60, 30, 15],
        onboardingCompleted: false,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    templates: {
      getAll: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      setArchived: jest.fn().mockResolvedValue(undefined),
      seedIfEmpty: jest.fn().mockResolvedValue(false),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    rotations: {
      getAll: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    rotationExceptions: {
      getAll: jest.fn().mockResolvedValue([]),
      getByDateRange: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    },
    scheduledReminders: {
      getAll: jest.fn().mockResolvedValue([]),
    },
    shifts: {
      getAll: jest.fn().mockResolvedValue([]),
      getByDateRange: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe('OnboardingScreen', () => {
  const testSettings: AppSettings = {
    themeMode: 'dark',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30, 15],
    onboardingCompleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(false);
    (repositories.templates.getAll as jest.Mock).mockResolvedValue([
      ...DEFAULT_SHIFT_TEMPLATES,
    ]);

    useSettingsStore.setState({
      settings: testSettings,
      status: 'ready',
      error: null,
    });

    useTemplateStore.setState({
      templates: [...DEFAULT_SHIFT_TEMPLATES],
      status: 'ready',
      error: null,
    });

    useRotationStore.setState({
      rotations: [],
      exceptions: [],
      exceptionsRange: null,
      status: 'ready',
      error: null,
    });

    jest.spyOn(expoPermissionChecker, 'getPermissionStatus').mockResolvedValue('granted');
  });

  it('steps through all 4 wizard steps, configures settings, and finishes setup', async () => {
    await renderWithProviders(<OnboardingScreen />);

    // --- Step 1: Shift Preset ---
    expect(screen.getByText('What kind of shifts do you work?')).toBeTruthy();
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();

    // Select 8-Hour 3-Shift preset
    const presetCard = screen.getByLabelText(
      '8-Hour 3-Shift, Morning / Evening / Night. Tap to select',
    );
    await fireEvent.press(presetCard);

    // Tap Continue
    const continueBtn1 = screen.getByLabelText('Continue to next step');
    await fireEvent.press(continueBtn1);

    // --- Step 2: Schedule Pattern ---
    expect(screen.getByText('How is your schedule structured?')).toBeTruthy();
    expect(screen.getByText('Step 2 of 4')).toBeTruthy();

    // Select Repeating Rotation
    const rotationCard = screen.getByLabelText(
      'Repeating Rotation. My shifts repeat in a regular cycle. Tap to select',
    );
    await fireEvent.press(rotationCard);

    // Quick select rotation chip: 5 Morn / 2 Off
    const chipPattern = screen.getByLabelText('5 Morn / 2 Off pattern. Tap to select');
    await fireEvent.press(chipPattern);

    // Tap Continue
    const continueBtn2 = screen.getByLabelText('Continue to next step');
    await fireEvent.press(continueBtn2);

    // --- Step 3: Appearance ---
    expect(screen.getByText('How should your calendar look?')).toBeTruthy();
    expect(screen.getByText('Step 3 of 4')).toBeTruthy();

    // Toggle theme to dark, week start to Monday, time format to 24h
    const darkChip = screen.getByLabelText('Dark theme mode');
    await fireEvent.press(darkChip);
    expect(useSettingsStore.getState().settings?.themeMode).toBe('dark');

    const mondayChip = screen.getByLabelText('Start week on Monday');
    await fireEvent.press(mondayChip);
    expect(useSettingsStore.getState().settings?.weekStart).toBe(1);

    const timeChip = screen.getByLabelText('24-hour time format');
    await fireEvent.press(timeChip);
    expect(useSettingsStore.getState().settings?.timeFormat).toBe('24h');

    // Tap Continue
    const continueBtn3 = screen.getByLabelText('Continue to next step');
    await fireEvent.press(continueBtn3);

    // --- Step 4: Reminders & Finish ---
    expect(screen.getByText('Want a heads-up before your shift starts?')).toBeTruthy();
    expect(screen.getByText('Step 4 of 4')).toBeTruthy();

    // Press Finish Setup
    const finishBtn = screen.getByLabelText('Finish Setup');
    await fireEvent.press(finishBtn);

    // Verify settings updated onboardingCompleted: true
    expect(useSettingsStore.getState().settings?.onboardingCompleted).toBe(true);

    // Verify navigation reset to MainTabs
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: ROOT_ROUTES.MAIN_TABS }],
    });
  });

  it('skips onboarding immediately and marks onboardingCompleted: true', async () => {
    await renderWithProviders(<OnboardingScreen />);

    const skipButton = screen.getByLabelText('Skip onboarding setup');
    expect(skipButton).toBeTruthy();

    await fireEvent.press(skipButton);

    expect(useSettingsStore.getState().settings?.onboardingCompleted).toBe(true);
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: ROOT_ROUTES.MAIN_TABS }],
    });
  });

  it('navigates backwards between steps using back button', async () => {
    await renderWithProviders(<OnboardingScreen />);

    expect(screen.getByText('Step 1 of 4')).toBeTruthy();

    // Advance to step 2
    const continueBtn = screen.getByLabelText('Continue to next step');
    await fireEvent.press(continueBtn);
    expect(screen.getByText('Step 2 of 4')).toBeTruthy();

    // Go back to step 1
    const backBtn = screen.getByLabelText('Go back to previous step');
    await fireEvent.press(backBtn);
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();
  });
});
