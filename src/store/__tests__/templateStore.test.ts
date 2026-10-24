import { useTemplateStore } from '../templateStore';
import type { ShiftTemplate } from '@/domain';
import { DEFAULT_SHIFT_TEMPLATES } from '@/constants';

const mockGetAll = jest.fn<
  Promise<ShiftTemplate[]>,
  [options: { readonly includeArchived: boolean }]
>();
const mockSetArchived = jest.fn<Promise<void>, [id: string, archivedAt: number | null]>();
const mockInsert = jest.fn<Promise<void>, [template: ShiftTemplate]>();
const mockUpdate = jest.fn<Promise<void>, [template: ShiftTemplate]>();

jest.mock('@/db', () => ({
  repositories: {
    templates: {
      getAll: (options: { readonly includeArchived: boolean }) => mockGetAll(options),
      insert: (template: ShiftTemplate) => mockInsert(template),
      update: (template: ShiftTemplate) => mockUpdate(template),
      setArchived: (id: string, archivedAt: number | null) => mockSetArchived(id, archivedAt),
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

describe('templateStore applyTemplatePreset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTemplateStore.setState({
      templates: [...DEFAULT_SHIFT_TEMPLATES],
      status: 'ready',
      error: null,
    });
  });

  it('applies 8h-three-shift preset by inserting missing templates and unarchiving existing', async () => {
    mockGetAll.mockResolvedValue([...DEFAULT_SHIFT_TEMPLATES]);
    mockSetArchived.mockResolvedValue(undefined);
    mockInsert.mockResolvedValue(undefined);

    await useTemplateStore.getState().applyTemplatePreset('8h-three-shift');

    // Should archive default-day and default-night since they are not in 8h-three-shift
    expect(mockSetArchived).toHaveBeenCalledWith('default-day', expect.any(Number));
    expect(mockSetArchived).toHaveBeenCalledWith('default-night', expect.any(Number));

    // Should insert preset-8h-morning, preset-8h-evening, preset-8h-night
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'preset-8h-morning' }));
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'preset-8h-evening' }));
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'preset-8h-night' }));
  });
});
