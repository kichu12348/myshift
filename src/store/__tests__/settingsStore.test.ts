import {
  useSettingsStore,
  selectOnboardingCompleted,
  selectSettings,
} from '../settingsStore';
import type { AppSettings } from '@/domain';

const mockGetOrCreate = jest.fn<Promise<AppSettings>, [defaults: AppSettings]>();
const mockUpdate = jest.fn<Promise<void>, [settings: AppSettings]>();

jest.mock('@/db', () => ({
  repositories: {
    settings: {
      getOrCreate: (defaults: AppSettings) => mockGetOrCreate(defaults),
      update: (settings: AppSettings) => mockUpdate(settings),
    },
  },
}));

jest.mock('@/services', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/services');
  return {
    ...actual,
    requestReminderSync: jest.fn().mockResolvedValue(undefined),
  };
});

describe('settingsStore and selectOnboardingCompleted', () => {
  const initialSettings: AppSettings = {
    themeMode: 'auto',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30, 15],
    onboardingCompleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      settings: null,
      status: 'idle',
      error: null,
    });
  });

  it('loads settings and reflects onboardingCompleted status', async () => {
    mockGetOrCreate.mockResolvedValueOnce(initialSettings);

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.status).toBe('ready');
    expect(selectSettings(state)).toEqual(initialSettings);
    expect(selectOnboardingCompleted(state)).toBe(false);
  });

  it('updates onboardingCompleted and notifies repository', async () => {
    useSettingsStore.setState({
      settings: initialSettings,
      status: 'ready',
      error: null,
    });
    mockUpdate.mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().updateSettings({ onboardingCompleted: true });

    const state = useSettingsStore.getState();
    expect(selectOnboardingCompleted(state)).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingCompleted: true }),
    );
  });

  it('rejects invalid non-boolean onboardingCompleted setting', async () => {
    useSettingsStore.setState({
      settings: initialSettings,
      status: 'ready',
      error: null,
    });

    await expect(
      useSettingsStore
        .getState()
        .updateSettings({ onboardingCompleted: 'yes' as unknown as boolean }),
    ).rejects.toThrow('Invalid onboardingCompleted setting');
  });
});
